import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    canAdvance,
    createWarGame,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playWarFaceDown,
    resolveBattle,
    resolveWar,
    startBattle,
} from "./warEngine.js";
import {
    BATTLE_REVEAL_DELAY_MS,
    GAME_ID,
    MAX_PLAYERS,
    MIN_PLAYERS,
    NEXT_BATTLE_DELAY_MS,
    PHASE,
    WAR_REVEAL_DELAY_MS,
} from "./warRules.js";

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

function emitToPlayers(io, game, event, payload) {
    for (const player of game.players) {
        if (player.socketId) io.to(player.socketId).emit(event, payload);
    }
}

function emitStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("war:state", getPrivateState(game, player.id));
        }
    }
}

function emitError(socket, message) {
    socket.emit("war:error", { message });
}

function schedule(io, game, delay, action) {
    clearTimer(game.roomCode);
    const roomKey = key(game.roomCode);
    const timer = setTimeout(() => {
        if (timers.get(roomKey) === timer) timers.delete(roomKey);
        try {
            const live = getGame(game.roomCode);
            if (!live) return;
            action(live);
        } catch (error) {
            console.error("War progression error:", error);
            emitToPlayers(io, game, "war:error", { message: error.message });
        }
    }, delay);
    timers.set(roomKey, timer);
}

function emitBattleResult(io, game, result) {
    io.to(game.roomCode).emit("war:battle-result", {
        ...result,
        state: getPublicState(game),
    });
}

function progress(io, game) {
    if (timers.has(key(game.roomCode))) return;

    if (game.status === "complete") {
        emitStates(io, game);
        io.to(game.roomCode).emit("war:game-complete", getPublicState(game));
        return;
    }

    if (game.phase === PHASE.READY || game.phase === PHASE.BATTLE_RESULT) {
        if (!canAdvance(game)) return;
        game.nextBattleAt = null;
        startBattle(game);
        emitStates(io, game);
        io.to(game.roomCode).emit("war:battle-start", getPublicState(game));
        schedule(io, game, BATTLE_REVEAL_DELAY_MS, (live) => {
            const result = resolveBattle(live);
            if (result.type === "war") {
                emitStates(io, live);
                io.to(live.roomCode).emit("war:war-start", getPublicState(live));
                schedule(io, live, 1200, (next) => progress(io, next));
                return;
            }
            emitStates(io, live);
            emitBattleResult(io, live, result);
            io.to(live.roomCode).emit("war:pile-transfer", {
                winnerId: result.winnerId,
                cards: live.lastCollectedCount,
            });
            if (live.status === "complete") {
                emitStates(io, live);
                io.to(live.roomCode).emit("war:game-complete", getPublicState(live));
                return;
            }
            live.nextBattleAt = Date.now() + NEXT_BATTLE_DELAY_MS;
            emitStates(io, live);
            io.to(live.roomCode).emit("war:next-battle", getPublicState(live));
            schedule(io, live, NEXT_BATTLE_DELAY_MS, (next) => progress(io, next));
        });
        return;
    }

    if (game.phase === PHASE.WAR) {
        playWarFaceDown(game);
        emitStates(io, game);
        io.to(game.roomCode).emit("war:war-reveal", getPublicState(game));
        schedule(io, game, WAR_REVEAL_DELAY_MS, (live) => progress(io, live));
        return;
    }

    if (game.phase === PHASE.WAR_REVEAL) {
        const result = resolveWar(game);
        emitStates(io, game);
        if (result.type === "war") {
            io.to(game.roomCode).emit("war:war-start", getPublicState(game));
            schedule(io, game, 240, (next) => progress(io, next));
            return;
        }

        emitBattleResult(io, game, result);
        if (result.winnerId) {
            io.to(game.roomCode).emit("war:pile-transfer", {
                winnerId: result.winnerId,
                cards: game.lastCollectedCount,
            });
        }
        if (game.status === "complete") {
            io.to(game.roomCode).emit("war:game-complete", getPublicState(game));
            return;
        }
        game.nextBattleAt = Date.now() + NEXT_BATTLE_DELAY_MS;
        emitStates(io, game);
        io.to(game.roomCode).emit("war:next-battle", getPublicState(game));
        schedule(io, game, NEXT_BATTLE_DELAY_MS, (next) => progress(io, next));
    }
}

function ensureGame(room) {
    const normalized = room.code.toUpperCase();
    let game = getGame(normalized);
    if (!game) {
        game = createWarGame(room);
        games.set(normalized, game);
    }
    return game;
}

export function setupWarSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("war:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== GAME_ID) throw new Error("War room not found.");
            if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
                throw new Error(`War supports exactly ${MIN_PLAYERS} players.`);
            }
            if (room.status !== "playing") throw new Error("The War game has not started.");
            if (!room.players.some((player) => player.id === userId)) throw new Error("You are not part of this War room.");

            const game = ensureGame(room);
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("War player not found.");

            updatePlayerSocket(room.code, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(room.code.toUpperCase());
            socket.data.roomCode = room.code.toUpperCase();
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
            progress(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("war:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("War game not found.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this War game.");

            updatePlayerSocket(game.roomCode, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;
            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
            progress(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("war:state", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("War game not found.");
            callback({ success: true, state: getPrivateState(game, userId) });
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("war:start-battle", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);
            if (!game) throw new Error("War game not found.");
            if (!getGamePlayer(game, userId)) throw new Error("You are not part of this War game.");
            if (!game.players.every((player) => player.connected)) throw new Error("Both players must be connected.");
            progress(io, game);
            callback({ success: true, state: getPrivateState(game, userId) });
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
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
