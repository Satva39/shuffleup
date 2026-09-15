import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createGame,
    startGame,
    submitBid,
    choosePartnerCard,
    takeBlindAndDiscard,
    playCard,
    startNextRound,
    markPlayerConnection,
    getPublicState,
} from "./napoleonEngine.js";

const games = new Map();

function getGame(roomCode) {
    return games.get(roomCode.toUpperCase());
}

function initializeNapoleon(room) {
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
        const playerSocket =
            io.sockets.sockets.get(player.socketId);

        if (!playerSocket) continue;

        playerSocket.emit(
            "napoleon:state",
            getPublicState(game, player.id)
        );
    }
}

function validateIdentity(socket, roomCode, userId) {
    if (socket.data.userId !== userId) {
        throw new Error("Invalid player identity.");
    }

    if (
        socket.data.roomCode?.toUpperCase() !==
        roomCode?.toUpperCase()
    ) {
        throw new Error("Invalid room.");
    }
}

function setupNapoleonSocket(io, socket, roomManager) {
    socket.on(
        "napoleon:join",
        ({ roomCode, userId }, callback) => {
            try {
                assertSocketPlayer(socket, userId);
                const room = roomManager.getRoom(roomCode);

                if (!room) throw new Error("Room not found.");
                if (room.gameId !== "napoleon") {
                    throw new Error(
                        "This room is not a Napoleon game."
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
                    initializeNapoleon(room);

                markPlayerConnection(
                    game,
                    userId,
                    true,
                    socket.id
                );

                // Always hydrate the socket that just joined first.
                // This prevents the initial table state from being missed
                // during the room -> game navigation handoff.
                socket.emit(
                    "napoleon:state",
                    getPublicState(game, userId)
                );

                emitState(io, game);

                callback({ success: true });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "napoleon:bid",
        ({ roomCode, userId, bid }, callback) => {
            try {
                validateIdentity(
                    socket,
                    roomCode,
                    userId
                );

                const game = getGame(roomCode);
                if (!game) {
                    throw new Error("Napoleon game not found.");
                }

                const result = submitBid(
                    game,
                    userId,
                    bid
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "napoleon:bid-updated",
                    {
                        playerId: userId,
                        bid: bid === "pass" ? "pass" : bid,
                        redealt: Boolean(result?.redealt),
                    }
                );

                callback({ success: true });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });

                socket.emit("napoleon:error", {
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "napoleon:call-partner",
        ({ roomCode, userId, card }, callback) => {
            try {
                validateIdentity(
                    socket,
                    roomCode,
                    userId
                );

                const game = getGame(roomCode);
                if (!game) {
                    throw new Error("Napoleon game not found.");
                }

                choosePartnerCard(
                    game,
                    userId,
                    card
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "napoleon:contract-updated"
                );

                callback({ success: true });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });

                socket.emit("napoleon:error", {
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "napoleon:discard",
        ({ roomCode, userId, cardIds }, callback) => {
            try {
                validateIdentity(
                    socket,
                    roomCode,
                    userId
                );

                const game = getGame(roomCode);
                if (!game) {
                    throw new Error("Napoleon game not found.");
                }

                takeBlindAndDiscard(
                    game,
                    userId,
                    cardIds
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "napoleon:play-started"
                );

                callback({ success: true });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });

                socket.emit("napoleon:error", {
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "napoleon:play-card",
        ({ roomCode, userId, cardId }, callback) => {
            try {
                validateIdentity(
                    socket,
                    roomCode,
                    userId
                );

                const game = getGame(roomCode);
                if (!game) {
                    throw new Error("Napoleon game not found.");
                }

                const result = playCard(
                    game,
                    userId,
                    cardId
                );

                emitState(io, game);

                io.to(game.roomCode).emit(
                    "napoleon:card-played",
                    {
                        playerId: userId,
                        card: result.card,
                        winnerId: result.winnerId,
                        trickComplete:
                            result.trickComplete,
                        roundComplete:
                            result.roundComplete,
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

                socket.emit("napoleon:error", {
                    message: error.message,
                });
            }
        }
    );

    socket.on(
        "napoleon:next-round",
        ({ roomCode, userId }, callback) => {
            try {
                validateIdentity(
                    socket,
                    roomCode,
                    userId
                );

                const game = getGame(roomCode);
                if (!game) {
                    throw new Error("Napoleon game not found.");
                }

                const player = game.players.find(
                    (item) => item.id === userId
                );

                if (!player) {
                    throw new Error("Player not found.");
                }

                const nextRound =
                    startNextRound(game);

                emitState(io, game);

                io.to(game.roomCode).emit(
                    nextRound
                        ? "napoleon:next-round"
                        : "napoleon:game-complete"
                );

                callback({ success: true });
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    socket.on("disconnect", () => {
        const roomCode = socket.data.roomCode;
        const userId = socket.data.userId;

        if (!roomCode || !userId) return;

        const game = getGame(roomCode);
        if (!game) return;

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
    initializeNapoleon,
    setupNapoleonSocket,
};
