import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createTeenPattiGame,
    applyAction,
    markPlayerDisconnected,
    reconnectPlayer,
    getPublicGameState,
    getPrivateGameState,
} from "./teenPattiEngine.js";

const games = new Map();

function getGameKey(roomCode) {
    return roomCode.toUpperCase();
}

function emitPlayerStates(io, game) {
    const roomCode = game.roomCode;

    for (const player of game.players) {
        const socketId = player.socketId;

        if (!socketId) {
            continue;
        }

        io.to(socketId).emit(
            "teen-patti:state",
            getPrivateGameState(game, player.id)
        );
    }

    io.to(roomCode).emit(
        "teen-patti:public-state",
        getPublicGameState(game)
    );
}

function emitRoundEvents(
    io,
    game,
    previousStatus,
    previousRound
) {
    // A round has just finished.
    if (
        previousStatus === "playing" &&
        game.status === "round-complete" &&
        game.lastRoundResult
    ) {
        io.to(game.roomCode).emit(
            "teen-patti:round-complete",
            game.lastRoundResult
        );
    }

    // The complete game has just finished.
    if (
        previousStatus !== "complete" &&
        game.status === "complete"
    ) {
        io.to(game.roomCode).emit(
            "teen-patti:game-complete",
            game.result
        );
    }
}

export function setupTeenPattiSocket(
    io,
    socket,
    {
        getRoom,
        updatePlayerSocket,
    }
) {
    socket.on(
        "teen-patti:join",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const room = getRoom(roomCode);

                if (!room) {
                    throw new Error(
                        "Room not found."
                    );
                }

                const player = room.players.find(
                    (item) => item.id === userId
                );

                if (!player) {
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

                socket.data.roomCode = room.code;
                socket.data.userId = userId;

                let game = games.get(
                    getGameKey(room.code)
                );

                if (!game) {
                    game = createTeenPattiGame(room);

                    game.players.forEach(
                        (gamePlayer) => {
                            const roomPlayer =
                                room.players.find(
                                    (item) =>
                                        item.id ===
                                        gamePlayer.id
                                );

                            gamePlayer.socketId =
                                roomPlayer?.socketId ||
                                null;
                        }
                    );

                    games.set(
                        getGameKey(room.code),
                        game
                    );
                }

                reconnectPlayer(game, userId);

                const gamePlayer = game.players.find(
                    (item) => item.id === userId
                );

                if (gamePlayer) {
                    gamePlayer.socketId =
                        socket.id;
                }

                callback({
                    success: true,
                    state: getPrivateGameState(
                        game,
                        userId
                    ),
                });

                emitPlayerStates(io, game);
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "teen-patti:action",
        ({ roomCode, userId, action }, callback) => {
            try {
                const game = games.get(
                    getGameKey(roomCode)
                );

                if (!game) {
                    throw new Error(
                        "Teen Patti game not found."
                    );
                }

                if (
                    socket.data.userId !== userId
                ) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                const previousStatus = game.status;
                const previousRound = game.round;

                applyAction(
                    game,
                    userId,
                    action
                );

                callback({
                    success: true,
                });

                emitRoundEvents(
                    io,
                    game,
                    previousStatus,
                    previousRound
                );

                emitPlayerStates(io, game);

            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });

                socket.emit(
                    "teen-patti:error",
                    {
                        message: error.message,
                    }
                );
            }
        }
    );

    socket.on(
        "teen-patti:reconnect",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const game = games.get(
                    getGameKey(roomCode)
                );

                if (!game) {
                    throw new Error(
                        "Game state not found."
                    );
                }

                if (
                    socket.data.userId &&
                    socket.data.userId !== userId
                ) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                socket.join(roomCode);

                socket.data.roomCode =
                    roomCode.toUpperCase();

                socket.data.userId = userId;

                reconnectPlayer(
                    game,
                    userId
                );

                const player = game.players.find(
                    (item) => item.id === userId
                );

                if (player) {
                    player.socketId =
                        socket.id;
                }

                callback({
                    success: true,
                    state: getPrivateGameState(
                        game,
                        userId
                    ),
                });

                emitPlayerStates(io, game);
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
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

        // Ignore an old socket disconnecting
        // after a newer connection exists.
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

        emitPlayerStates(io, game);
    });
}