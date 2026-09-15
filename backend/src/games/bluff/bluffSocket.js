import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    advanceAfterChallengeWindow,
    createBluffGame,
    expireChallengeWindow,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCards,
    resolveChallenge,
} from "./bluffEngine.js";
import { CHALLENGE_WINDOW_MS, MAX_PLAYERS, MIN_PLAYERS, PHASE } from "./bluffRules.js";

const games = new Map();
const timers = new Map();

function key(roomCode) {
    return String(roomCode).toUpperCase();
}

function getGame(roomCode) {
    return games.get(key(roomCode));
}

function clearTimer(roomCode) {
    const timer = timers.get(key(roomCode));
    if (timer) clearTimeout(timer);
    timers.delete(key(roomCode));
}

function emitStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("bluff:state", getPrivateState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("bluff:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("bluff:error", { message });
}

function scheduleChallengeExpiry(io, game) {
    clearTimer(game.roomCode);
    if (!game.currentClaim || ![PHASE.CHALLENGE, PHASE.FINAL_CHALLENGE].includes(game.phase)) return;

    const claimId = game.currentClaim.id;
    const remaining = Math.max(0, game.challengeExpiresAt - Date.now());

    const timer = setTimeout(() => {
        try {
            const liveGame = getGame(game.roomCode);
            if (!liveGame || liveGame.currentClaim?.id !== claimId) return;
            advanceAfterChallengeWindow(liveGame, claimId);
            emitStates(io, liveGame);
        } catch (error) {
            console.error("Bluff challenge window error:", error);
        } finally {
            clearTimer(game.roomCode);
        }
    }, remaining || CHALLENGE_WINDOW_MS);

    timers.set(game.roomCode, timer);
}

export function setupBluffSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("bluff:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== "bluff") throw new Error("Bluff room not found.");
            if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
                throw new Error(`Bluff supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`);
            }
            if (!room.players.some((player) => player.id === userId)) {
                throw new Error("You are not part of this Bluff room.");
            }
            if (room.status !== "playing") throw new Error("The Bluff game has not started.");

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createBluffGame(room);
                games.set(normalized, game);
            }

            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("Bluff player not found.");

            updatePlayerSocket(normalized, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);

            if (game.currentClaim) scheduleChallengeExpiry(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("bluff:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bluff game not found.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this Bluff game.");

            updatePlayerSocket(game.roomCode, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
            if (game.currentClaim) scheduleChallengeExpiry(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("bluff:state", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bluff game not found.");
            callback({ success: true, state: getPrivateState(game, userId) });
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("bluff:play-cards", ({ roomCode, userId, cardIds }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bluff game not found.");
            clearTimer(game.roomCode);
            const result = playCards(game, userId, cardIds);
            callback({ success: true, claim: result.claim });
            emitStates(io, game);
            scheduleChallengeExpiry(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("bluff:expire", ({ roomCode, userId, claimId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bluff game not found.");
            if (!getGamePlayer(game, userId)) throw new Error("You are not part of this Bluff game.");
            if (!claimId) throw new Error("The active claim is missing.");

            const result = expireChallengeWindow(game, claimId);
            if (!result.expired) {
                throw new Error("The challenge window is still open or already resolved.");
            }

            clearTimer(game.roomCode);
            callback({ success: true, result });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("bluff:challenge", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bluff game not found.");
            clearTimer(game.roomCode);
            const result = resolveChallenge(game, userId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("bluff:challenge-result", result);
            emitStates(io, game);
            if (game.currentClaim) scheduleChallengeExpiry(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
            const game = getGame(roomCode);
            if (game?.currentClaim) scheduleChallengeExpiry(io, game);
        }
    });

    socket.on("disconnect", () => {
        const roomCode = socket.data.roomCode;
        const userId = socket.data.userId;
        if (!roomCode || !userId) return;

        const game = getGame(roomCode);
        if (!game) return;

        const player = getGamePlayer(game, userId);
        if (!player || player.socketId !== socket.id) return;
        markPlayerConnection(game, userId, false, socket.id);
        emitStates(io, game);
    });
}
