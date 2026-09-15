import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    ACTIONS,
    MONGOOSE_CALL_WINDOW_MS,
} from "./mangooseRules.js";

import {
    applyAction,
    createMangooseGame,
    getPrivateGameState,
    getPublicGameState,
    markPlayerDisconnected,
    reconnectPlayer,
    resolvePendingMongoose,
} from "./mangooseEngine.js";

const games = new Map();
const mongooseTimers = new Map();

function getGameKey(roomCode) {
    return roomCode.toUpperCase();
}

function clearMongooseTimer(roomCode) {
    const key = getGameKey(roomCode);
    const timer = mongooseTimers.get(key);

    if (timer) {
        clearTimeout(timer);
        mongooseTimers.delete(key);
    }
}

function emitPlayerStates(io, game) {
    for (const player of game.players) {
        if (!player.socketId) {
            continue;
        }

        io.to(player.socketId).emit(
            "mangoose:state",
            getPrivateGameState(
                game,
                player.id
            )
        );
    }

    io.to(game.roomCode).emit(
        "mangoose:public-state",
        getPublicGameState(game)
    );
}

function emitActionEvent(
    io,
    game,
    result
) {
    if (result.type === "flipped") {
        io.to(game.roomCode).emit(
            "mangoose:card-flipped",
            {
                playerId:
                    result.playerId,
                card: result.card,
            }
        );
        return;
    }

    if (
        result.type === "open-card-ready"
    ) {
        io.to(game.roomCode).emit(
            "mangoose:card-flipped",
            {
                playerId:
                    result.playerId,
                card: result.card,
                source: "open",
            }
        );
        return;
    }

    if (
        result.type === "mongoose-window"
    ) {
        io.to(game.roomCode).emit(
            "mangoose:mongoose-window",
            {
                offenderId:
                    result.playerId,
                offenderUsername:
                    game.pendingMongoose
                        ?.offenderUsername,
                card: result.card,
                duration:
                    MONGOOSE_CALL_WINDOW_MS,
            }
        );
        return;
    }

    if (
        result.type === "mongoose-called" ||
        result.type ===
        "mongoose-called-game-complete"
    ) {
        io.to(game.roomCode).emit(
            "mangoose:mongoose-called",
            {
                callerId:
                    result.callerId,
                offenderId:
                    result.offenderId,
                offenderUsername:
                    result.offenderUsername,
                penaltyCount:
                    result.penaltyCount,
            }
        );

        const offender = game.players.find(
            (player) =>
                player.id ===
                result.offenderId
        );

        if (offender?.socketId) {
            io.to(offender.socketId).emit(
                "mangoose:notice",
                {
                    message:
                        result.message,
                }
            );
        }

        return;
    }

    if (
        result.type ===
        "mongoose-window-expired" ||
        result.type ===
        "mongoose-window-expired-game-complete"
    ) {
        io.to(game.roomCode).emit(
            "mangoose:mongoose-expired",
            {
                offenderId:
                    result.offenderId,
            }
        );
        return;
    }

    if (
        result.type === "continued" ||
        result.type === "turn-ended" ||
        result.type === "player-finished" ||
        result.type === "game-complete"
    ) {
        io.to(game.roomCode).emit(
            "mangoose:card-played",
            {
                playerId:
                    result.playerId,
                card: result.card,
                action: result.action,
                target: result.target,
                sameTurn:
                    result.sameTurn === true,
            }
        );
    }
}

function startMongooseTimer(io, game) {
    clearMongooseTimer(
        game.roomCode
    );

    const key = getGameKey(
        game.roomCode
    );

    const timer = setTimeout(() => {
        try {
            const currentGame = games.get(
                key
            );

            if (
                !currentGame ||
                !currentGame.pendingMongoose
            ) {
                return;
            }

            const result =
                resolvePendingMongoose(
                    currentGame
                );

            emitActionEvent(
                io,
                currentGame,
                result
            );

            if (
                currentGame.status ===
                "complete"
            ) {
                io.to(
                    currentGame.roomCode
                ).emit(
                    "mangoose:game-complete",
                    currentGame.result
                );
            }

            emitPlayerStates(
                io,
                currentGame
            );
        } finally {
            mongooseTimers.delete(key);
        }
    }, MONGOOSE_CALL_WINDOW_MS);

    mongooseTimers.set(key, timer);
}

export function setupMangooseSocket(
    io,
    socket,
    {
        getRoom,
        updatePlayerSocket,
    }
) {
    socket.on(
        "mangoose:join",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const room = getRoom(
                    roomCode
                );

                if (!room) {
                    throw new Error(
                        "Room not found."
                    );
                }

                if (
                    room.gameId !==
                    "mangoose"
                ) {
                    throw new Error(
                        "This room is not a Mangoose game."
                    );
                }

                if (
                    room.status !== "playing"
                ) {
                    throw new Error(
                        "The Mangoose game has not started."
                    );
                }

                const roomPlayer =
                    room.players.find(
                        (player) =>
                            player.id ===
                            userId
                    );

                if (!roomPlayer) {
                    throw new Error(
                        "You are not part of this room."
                    );
                }

                updatePlayerSocket(
                    room.code,
                    userId,
                    socket.id
                );

                socket.join(room.code);
                socket.data.roomCode =
                    room.code;
                socket.data.userId =
                    userId;

                const key = getGameKey(
                    room.code
                );

                let game = games.get(key);

                if (!game) {
                    game =
                        createMangooseGame(
                            room
                        );

                    game.players.forEach(
                        (player) => {
                            const source =
                                room.players.find(
                                    (item) =>
                                        item.id ===
                                        player.id
                                );

                            player.socketId =
                                source?.socketId ||
                                null;
                        }
                    );

                    games.set(key, game);
                }

                reconnectPlayer(
                    game,
                    userId
                );

                const gamePlayer =
                    game.players.find(
                        (player) =>
                            player.id ===
                            userId
                    );

                if (!gamePlayer) {
                    throw new Error(
                        "You are not part of this game."
                    );
                }

                gamePlayer.socketId =
                    socket.id;

                callback({
                    success: true,
                    state:
                        getPrivateGameState(
                            game,
                            userId
                        ),
                });

                emitPlayerStates(
                    io,
                    game
                );
            } catch (error) {
                callback({
                    success: false,
                    message:
                        error.message,
                });
            }
        }
    );

    socket.on(
        "mangoose:action",
        (
            {
                roomCode,
                userId,
                action,
                target,
            },
            callback
        ) => {
            try {
                const game = games.get(
                    getGameKey(roomCode)
                );

                if (!game) {
                    throw new Error(
                        "Mangoose game not found."
                    );
                }

                if (
                    socket.data.userId !==
                    userId
                ) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                if (
                    !Object.values(ACTIONS).includes(
                        action
                    )
                ) {
                    throw new Error(
                        "Invalid Mangoose action."
                    );
                }

                const result = applyAction(
                    game,
                    userId,
                    action,
                    target
                );

                if (
                    result.type ===
                    "mongoose-window"
                ) {
                    callback({
                        success: true,
                    });

                    emitActionEvent(
                        io,
                        game,
                        result
                    );
                    emitPlayerStates(
                        io,
                        game
                    );
                    startMongooseTimer(
                        io,
                        game
                    );
                    return;
                }

                if (
                    result.type ===
                    "mongoose-called" ||
                    result.type ===
                    "mongoose-called-game-complete"
                ) {
                    clearMongooseTimer(
                        game.roomCode
                    );
                }

                callback({
                    success: true,
                });

                emitActionEvent(
                    io,
                    game,
                    result
                );

                if (
                    game.status ===
                    "complete"
                ) {
                    io.to(
                        game.roomCode
                    ).emit(
                        "mangoose:game-complete",
                        game.result
                    );
                }

                emitPlayerStates(
                    io,
                    game
                );
            } catch (error) {
                callback({
                    success: false,
                    message:
                        error.message,
                });

                socket.emit(
                    "mangoose:error",
                    {
                        message:
                            error.message,
                    }
                );
            }
        }
    );

    socket.on(
        "mangoose:reconnect",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const game = games.get(
                    getGameKey(roomCode)
                );

                if (!game) {
                    throw new Error(
                        "Mangoose game state not found."
                    );
                }

                if (
                    socket.data.userId &&
                    socket.data.userId !==
                    userId
                ) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                socket.join(
                    roomCode.toUpperCase()
                );
                socket.data.roomCode =
                    roomCode.toUpperCase();
                socket.data.userId =
                    userId;

                reconnectPlayer(
                    game,
                    userId
                );

                const player =
                    game.players.find(
                        (item) =>
                            item.id === userId
                    );

                if (!player) {
                    throw new Error(
                        "You are not part of this game."
                    );
                }

                player.socketId =
                    socket.id;

                callback({
                    success: true,
                    state:
                        getPrivateGameState(
                            game,
                            userId
                        ),
                });

                emitPlayerStates(
                    io,
                    game
                );
            } catch (error) {
                callback({
                    success: false,
                    message:
                        error.message,
                });
            }
        }
    );

    socket.on("disconnect", () => {
        const roomCode =
            socket.data.roomCode;
        const userId =
            socket.data.userId;

        if (!roomCode || !userId) {
            return;
        }

        const game = games.get(
            getGameKey(roomCode)
        );

        if (!game) {
            return;
        }

        const player = game.players.find(
            (item) => item.id === userId
        );

        if (
            player?.socketId &&
            player.socketId !== socket.id
        ) {
            return;
        }

        markPlayerDisconnected(
            game,
            userId
        );

        if (!game.pendingMongoose) {
            emitPlayerStates(io, game);
        }
    });
}
