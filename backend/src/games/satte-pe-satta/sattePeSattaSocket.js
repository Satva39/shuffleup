import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    createGame,
    getPlayer,
    getPrivateState,
    getPublicState,
    startNextRound,
    markPlayerConnection,
    passTurn,
    playCard,
} from "./sattePeSattaEngine.js";
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_COMPLETE_DELAY_MS } from "./sattePeSattaRules.js";

const games = new Map();

function key(roomCode) {
    return String(roomCode || "").toUpperCase();
}

function getGame(roomCode) {
    return games.get(key(roomCode));
}

function emitStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("satte-pe-satta:state", getPrivateState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("satte-pe-satta:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("satte-pe-satta:error", { message });
}

function validateRoom(room, userId) {
    if (!room || room.gameId !== "satte-pe-satta") throw new Error("Satte Pe Satta room not found.");
    if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
        throw new Error(`Satte Pe Satta supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
    }
    if (!room.players.some((player) => player.id === userId)) {
        throw new Error("You are not part of this Satte Pe Satta room.");
    }
    if (room.status !== "playing") throw new Error("The Satte Pe Satta game has not started.");
}

export function setupSattePeSattaSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("satte-pe-satta:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            validateRoom(room, userId);

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createGame(room);
                games.set(normalized, game);
            }

            const player = getPlayer(game, userId);
            if (!player) throw new Error("Satte Pe Satta player not found.");

            updatePlayerSocket(normalized, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("satte-pe-satta:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Satte Pe Satta game not found.");
            const player = getPlayer(game, userId);
            if (!player) throw new Error("You are not part of this game.");

            updatePlayerSocket(game.roomCode, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("satte-pe-satta:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Satte Pe Satta game not found.");
            callback({ success: true, state: getPrivateState(game, userId) });
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("satte-pe-satta:play-card", ({ roomCode, userId, cardId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Satte Pe Satta game not found.");
            const result = playCard(game, userId, cardId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("satte-pe-satta:card-played", {
                playerId: userId,
                card: result.card,
                resultType: result.type,
            });
            emitStates(io, game);

            if (result.type === "round-complete") {
                io.to(game.roomCode).emit("satte-pe-satta:round-complete", result.result);
                setTimeout(() => {
                    const currentGame = getGame(game.roomCode);
                    if (!currentGame || currentGame.status !== "round-complete") return;
                    try {
                        startNextRound(currentGame);
                        io.to(currentGame.roomCode).emit("satte-pe-satta:next-round", {
                            roundNumber: currentGame.roundNumber,
                        });
                        emitStates(io, currentGame);
                    } catch (error) {
                        io.to(currentGame.roomCode).emit("satte-pe-satta:error", { message: error.message });
                    }
                }, ROUND_COMPLETE_DELAY_MS);
            } else if (result.type === "game-complete") {
                io.to(game.roomCode).emit("satte-pe-satta:game-complete", result.result);
            }
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("satte-pe-satta:pass", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Satte Pe Satta game not found.");
            const result = passTurn(game, userId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("satte-pe-satta:pass", {
                playerId: userId,
                nextPlayerId: result.nextPlayerId,
            });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });
}

export function getSattePeSattaGame(roomCode) {
    return getGame(roomCode);
}
