import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    ACTIONS,
    GAME_STATUS,
} from "./indianRummyRules.js";

import {
    applyAction,
    createIndianRummyGame,
    getPrivateGameState,
    getPublicGameState,
    markPlayerDisconnected,
    reconnectPlayer,
} from "./indianRummyEngine.js";

const games = new Map();

function getGameKey(roomCode) {
    return roomCode.toUpperCase();
}

function emitPlayerStates(io, game) {
    for (const player of game.players) {
        if (!player.socketId) continue;
        io.to(player.socketId).emit(
            "indian-rummy:state",
            getPrivateGameState(game, player.id)
        );
    }

    io.to(game.roomCode).emit(
        "indian-rummy:public-state",
        getPublicGameState(game)
    );
}

function ensureRoomPlayer(room, userId) {
    const player = room.players.find((item) => item.id === userId);
    if (!player) throw new Error("You are not part of this room.");
    return player;
}

export function setupIndianRummySocket(
    io,
    socket,
    { getRoom, updatePlayerSocket }
) {
    socket.on("indian-rummy:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room) throw new Error("Room not found.");
            ensureRoomPlayer(room, userId);

            updatePlayerSocket(room.code, userId, socket.id);
            socket.join(room.code);
            socket.data.roomCode = room.code;
            socket.data.userId = userId;

            const key = getGameKey(room.code);
            let game = games.get(key);

            if (!game) {
                game = createIndianRummyGame(room);
                games.set(key, game);
            }

            const roomSocketPlayers = room.players;
            for (const gamePlayer of game.players) {
                const roomPlayer = roomSocketPlayers.find((item) => item.id === gamePlayer.id);
                if (roomPlayer) gamePlayer.socketId = roomPlayer.socketId || gamePlayer.socketId;
            }

            reconnectPlayer(game, userId);
            const gamePlayer = game.players.find((item) => item.id === userId);
            if (gamePlayer) gamePlayer.socketId = socket.id;

            callback({
                success: true,
                state: getPrivateGameState(game, userId),
            });

            emitPlayerStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("indian-rummy:action", ({ roomCode, userId, action, cardId }, callback) => {
        try {
            const game = games.get(getGameKey(roomCode));
            if (!game) throw new Error("Indian Rummy game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");

            if (!Object.values(ACTIONS).includes(action)) {
                throw new Error("Invalid game action.");
            }

            applyAction(game, userId, action, cardId);

            callback({ success: true });
            emitPlayerStates(io, game);

            if (action === ACTIONS.DRAW_CLOSED || action === ACTIONS.DRAW_DISCARD) {
                io.to(game.roomCode).emit("indian-rummy:draw", {
                    playerId: userId,
                    source: action === ACTIONS.DRAW_CLOSED ? "closed" : "discard",
                });
            }

            if (action === ACTIONS.DISCARD) {
                io.to(game.roomCode).emit("indian-rummy:discard", {
                    playerId: userId,
                    discard: game.discardPile.at(-1),
                });
                io.to(game.roomCode).emit("indian-rummy:turn", {
                    currentPlayerId: game.currentPlayerId,
                });
            }

            if (action === ACTIONS.DECLARE && game.status === GAME_STATUS.COMPLETE) {
                io.to(game.roomCode).emit("indian-rummy:declare-result", game.result);
                io.to(game.roomCode).emit("indian-rummy:game-complete", game.result);
            }
        } catch (error) {
            callback({ success: false, message: error.message });
            socket.emit("indian-rummy:error", { message: error.message });
        }
    });

    socket.on("indian-rummy:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = games.get(getGameKey(roomCode));
            if (!game) throw new Error("Game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) {
                throw new Error("Invalid player identity.");
            }

            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;
            reconnectPlayer(game, userId);

            const player = game.players.find((item) => item.id === userId);
            if (player) player.socketId = socket.id;

            callback({ success: true, state: getPrivateGameState(game, userId) });
            emitPlayerStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("disconnect", () => {
        const roomCode = socket.data.roomCode;
        const userId = socket.data.userId;
        if (!roomCode || !userId) return;

        const game = games.get(getGameKey(roomCode));
        if (!game) return;

        const player = game.players.find((item) => item.id === userId);
        if (player?.socketId && player.socketId !== socket.id) return;

        markPlayerDisconnected(game, userId);
        emitPlayerStates(io, game);
    });
}
