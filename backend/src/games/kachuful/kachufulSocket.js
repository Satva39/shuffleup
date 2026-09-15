import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createGame,
    startGame,
    submitBid,
    playCard,
    startNextRound,
    markPlayerConnection,
    getPublicState,
} from "./kachufulEngine.js";

const games = new Map();

function getGame(roomCode) {
    return games.get(roomCode.toUpperCase());
}

function initializeKachuful(room) {
    const code = room.code.toUpperCase();

    if (games.has(code)) {
        return games.get(code);
    }

    const game = createGame(room);

    startGame(game);

    games.set(code, game);

    return game;
}

function emitState(io, game) {
    for (const player of game.players) {
        const playerSocket = io.sockets.sockets.get(
            player.socketId
        );

        if (!playerSocket) {
            continue;
        }

        playerSocket.emit(
            "kachuful:state",
            getPublicState(game, player.id)
        );
    }
}

function setupKachufulSocket(io, socket, roomManager) {
    socket.on(
        "kachuful:join",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const room =
                    roomManager.getRoom(roomCode);

                if (!room) {
                    throw new Error("Room not found.");
                }

                if (room.gameId !== "kachuful") {
                    throw new Error(
                        "This room is not a Kachuful game."
                    );
                }

                const player = room.players.find(
                    (item) => item.id === userId
                );

                if (!player) {
                    throw new Error(
                        "You are not a player in this room."
                    );
                }

                roomManager.updatePlayerSocket(
                    room.code,
                    userId,
                    socket.id
                );

                socket.join(room.code);

                socket.data.roomCode = room.code;
                socket.data.userId = userId;

                const game =
                    getGame(room.code) ||
                    initializeKachuful(room);

                markPlayerConnection(
                    game,
                    userId,
                    true,
                    socket.id
                );

                emitState(io, game);

                callback({
                    success: true,
                });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "kachuful:bid",
        ({ roomCode, userId, bid }, callback) => {
            try {
                const game = getGame(roomCode);

                if (!game) {
                    throw new Error(
                        "Kachuful game not found."
                    );
                }

                if (socket.data.userId !== userId) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                if (
                    socket.data.roomCode?.toUpperCase() !==
                    roomCode?.toUpperCase()
                ) {
                    throw new Error(
                        "Invalid room."
                    );
                }

                const result = submitBid(
                    game,
                    userId,
                    bid
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "kachuful:bid-submitted",
                    {
                        playerId: userId,
                        allSubmitted:
                            result.allSubmitted,
                    }
                );

                callback({
                    success: true,
                });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "kachuful:play-card",
        ({ roomCode, userId, cardId }, callback) => {
            try {
                const game = getGame(roomCode);

                if (!game) {
                    throw new Error(
                        "Kachuful game not found."
                    );
                }

                if (socket.data.userId !== userId) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                if (
                    socket.data.roomCode?.toUpperCase() !==
                    roomCode?.toUpperCase()
                ) {
                    throw new Error(
                        "Invalid room."
                    );
                }

                const result = playCard(
                    game,
                    userId,
                    cardId
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "kachuful:card-played",
                    {
                        playerId: userId,
                        card: result.card,
                    }
                );

                callback({
                    success: true,
                });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });

                socket.emit(
                    "kachuful:error",
                    {
                        message: error.message,
                    }
                );
            }
        }
    );

    socket.on(
        "kachuful:next-round",
        ({ roomCode, userId }, callback) => {
            try {
                const game = getGame(roomCode);

                if (!game) {
                    throw new Error(
                        "Kachuful game not found."
                    );
                }

                if (socket.data.userId !== userId) {
                    throw new Error(
                        "Invalid player identity."
                    );
                }

                if (
                    socket.data.roomCode?.toUpperCase() !==
                    roomCode?.toUpperCase()
                ) {
                    throw new Error(
                        "Invalid room."
                    );
                }

                const player = game.players.find(
                    (item) => item.id === userId
                );

                if (!player) {
                    throw new Error(
                        "Player not found."
                    );
                }

                const hasNextRound =
                    startNextRound(game);

                emitState(io, game);

                if (hasNextRound) {
                    io.to(game.roomCode).emit(
                        "kachuful:next-round"
                    );
                } else {
                    io.to(game.roomCode).emit(
                        "kachuful:game-complete"
                    );
                }

                callback({
                    success: true,
                });
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

        const game = getGame(roomCode);

        if (!game) {
            return;
        }

        markPlayerConnection(
            game,
            userId,
            false,
            socket.id
        );

        emitState(io, game);
    });
}

export {
    getGame,
    initializeKachuful,
    setupKachufulSocket,
};