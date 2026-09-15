import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    autoDraw,
    createJackThiefGame,
    drawCard,
    getPlayer,
    getPrivateGameState,
    getPublicGameState,
    markDisconnected,
    reconnectPlayer,
    scheduleDisconnectAutoDraw,
    startJackThief,
} from "./jackThiefEngine.js";
import { STATUS, PLAYER_STATUS } from "./jackThiefRules.js";

const games = new Map();

function gameKey(roomCode) {
    return roomCode.toUpperCase();
}

function ensureGame(room) {
    const key = gameKey(room.code);
    let game = games.get(key);
    if (!game) {
        game = createJackThiefGame(room);
        games.set(key, game);
    }
    return game;
}

function allRoomPlayersConnectedToGame(game, room) {
    return room.players.every((roomPlayer) => Boolean(getPlayer(game, roomPlayer.id)?.socketId));
}

function emitStates(io, game) {
    io.to(game.roomCode).emit("jack-thief:public-state", getPublicGameState(game));
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("jack-thief:state", getPrivateGameState(game, player.id));
        }
    }
}

function emitError(socket, callback, error) {
    const payload = { message: error.message || "Jack Thief action failed." };
    socket.emit("jack-thief:error", payload);
    if (callback) callback({ success: false, message: payload.message });
}

function maybeStartGame(io, game, room) {
    if (game.started || !allRoomPlayersConnectedToGame(game, room)) return;
    startJackThief(game);
    emitStates(io, game);
    io.to(game.roomCode).emit("jack-thief:deal", {
        removedPairs: game.removedPairs,
        status: game.status,
    });
    if (game.currentPlayerId) {
        io.to(game.roomCode).emit("jack-thief:turn", {
            playerId: game.currentPlayerId,
            targetPlayerId: getPublicGameState(game).targetPlayerId,
            deadline: game.turnDeadline,
        });
    }
}

function afterMove(io, game, result, actorId) {
    io.to(game.roomCode).emit("jack-thief:card-drawn", {
        playerId: actorId,
        targetPlayerId: result.targetPlayerId,
        formedPairs: result.formedPairs,
        automatic: Boolean(result.automatic),
    });

    if (result.formedPairs.length) {
        io.to(game.roomCode).emit("jack-thief:pair-removed", {
            playerId: actorId,
            pairs: result.formedPairs,
        });
    }

    const actor = getPlayer(game, actorId);
    if (actor?.status === PLAYER_STATUS.FINISHED) {
        io.to(game.roomCode).emit("jack-thief:player-finished", {
            playerId: actorId,
            eliminationPlace: actor.eliminationPlace,
        });
    }

    if (game.status === STATUS.COMPLETE) {
        io.to(game.roomCode).emit("jack-thief:round-complete", {
            loserId: game.loserId,
            finalJack: game.finalJack,
            eliminationOrder: [...game.eliminationOrder],
        });
        io.to(game.roomCode).emit("jack-thief:game-complete", {
            loserId: game.loserId,
            finalJack: game.finalJack,
            eliminationOrder: [...game.eliminationOrder],
        });
    } else if (game.currentPlayerId) {
        const publicState = getPublicGameState(game);
        io.to(game.roomCode).emit("jack-thief:turn", {
            playerId: game.currentPlayerId,
            targetPlayerId: publicState.targetPlayerId,
            deadline: game.turnDeadline,
        });
    }

    emitStates(io, game);
}

function scheduleAutomaticMove(io, game, playerId) {
    scheduleDisconnectAutoDraw(game, playerId, () => {
        const current = getPlayer(game, playerId);
        if (!current || current.connected || game.status !== STATUS.PLAYING || game.currentPlayerId !== playerId) return;
        try {
            const result = autoDraw(game, playerId);
            if (result) afterMove(io, game, result, playerId);
        } catch (error) {
            console.error("Jack Thief auto-draw failed:", error);
        }
    });
}

export function setupJackThiefSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("jack-thief:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const normalized = roomCode.toUpperCase();
            const room = getRoom(normalized);
            if (!room || room.gameId !== "jack-thief") throw new Error("Jack Thief room not found.");
            if (!room.players.some((player) => player.id === userId)) {
                throw new Error("You are not part of this Jack Thief room.");
            }
            if (room.status !== "playing") throw new Error("The Jack Thief game has not started.");

            const game = ensureGame(room);
            reconnectPlayer(game, userId, socket.id);
            updatePlayerSocket(normalized, userId, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;
            socket.data.gameId = "jack-thief";

            maybeStartGame(io, game, room);
            callback({ success: true, state: getPrivateGameState(game, userId) });
            emitStates(io, game);
        } catch (error) {
            emitError(socket, callback, error);
        }
    });

    socket.on("jack-thief:draw", ({ roomCode, userId, targetPlayerId, cardIndex }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = games.get(gameKey(roomCode));
            if (!game) throw new Error("Jack Thief game state not found.");
            const result = drawCard(game, userId, targetPlayerId, cardIndex);
            callback({ success: true });
            afterMove(io, game, result, userId);
        } catch (error) {
            emitError(socket, callback, error);
        }
    });

    socket.on("jack-thief:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = games.get(gameKey(roomCode));
            if (!game) throw new Error("Jack Thief game state not found.");
            reconnectPlayer(game, userId, socket.id);
            updatePlayerSocket(roomCode.toUpperCase(), userId, socket.id);
            socket.join(roomCode.toUpperCase());
            socket.data.roomCode = roomCode.toUpperCase();
            socket.data.userId = userId;
            socket.data.gameId = "jack-thief";
            callback({ success: true, state: getPrivateGameState(game, userId) });
            emitStates(io, game);
        } catch (error) {
            emitError(socket, callback, error);
        }
    });

    socket.on("jack-thief:request-state", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = games.get(gameKey(roomCode));
            if (!game) throw new Error("Jack Thief game state not found.");
            callback({ success: true, state: getPrivateGameState(game, userId) });
        } catch (error) {
            emitError(socket, callback, error);
        }
    });

    socket.on("disconnect", () => {
        if (socket.data.gameId !== "jack-thief") return;
        const roomCode = socket.data.roomCode;
        const userId = socket.data.userId;
        if (!roomCode || !userId) return;

        const game = games.get(gameKey(roomCode));
        if (!game) return;

        const player = markDisconnected(game, userId, socket.id);
        if (!player) return;

        io.to(roomCode).emit("jack-thief:player-status", {
            playerId: userId,
            connected: false,
        });
        emitStates(io, game);

        if (game.currentPlayerId === userId && game.status === STATUS.PLAYING) {
            scheduleAutomaticMove(io, game, userId);
        }
    });
}

export function getJackThiefGame(roomCode) {
    return games.get(gameKey(roomCode));
}
