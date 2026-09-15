import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    ACTIONS,
    STATUS,
} from "./unoRules.js";

import {
    applyAction,
    createUnoGame,
    getPrivateGameState,
    getPublicGameState,
    getPlayer,
    markPlayerDisconnected,
    reconnectPlayer,
    startNextRound,
} from "./unoEngine.js";

const games = new Map();

function getGameKey(roomCode) {
    return roomCode.toUpperCase();
}

function emitPlayerStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("uno:state", getPrivateGameState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("uno:public-state", getPublicGameState(game));
}

function emitActionEvent(io, game, result) {
    const events = {
        "card-played": "uno:card-played",
        "round-complete": "uno:round-complete",
        "color-required": "uno:color-required",
        "color-chosen": "uno:color-chosen",
        "card-drawn": "uno:card-drawn",
        "card-drawn-playable": "uno:card-drawn",
        "uno-declared": "uno:uno",
        "uno-called": "uno:uno-called",
    };
    const event = events[result.type];
    if (event) {
        io.to(game.roomCode).emit(event, result);
    }
}

export function setupUnoSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("uno:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const normalized = roomCode.toUpperCase();
            const room = getRoom(normalized);
            if (!room || room.gameId !== "uno") {
                throw new Error("UNO room not found.");
            }
            if (!room.players.some((player) => player.id === userId)) {
                throw new Error("You are not part of this UNO room.");
            }

            let game = games.get(getGameKey(normalized));
            if (!game) {
                if (room.status !== "playing") throw new Error("The UNO game has not started.");
                game = createUnoGame(room);
                games.set(getGameKey(normalized), game);
            }

            reconnectPlayer(game, userId, socket.id);
            updatePlayerSocket(normalized, userId, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateGameState(game, userId) });
            emitPlayerStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("uno:action", ({ roomCode, userId, action, payload }, callback) => {
        try {
            const game = games.get(getGameKey(roomCode));
            if (!game) throw new Error("UNO game state not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (!Object.values(ACTIONS).includes(action)) throw new Error("Invalid UNO action.");

            if (action === ACTIONS.NEXT_ROUND) {
                if (game.status !== STATUS.ROUND_COMPLETE) throw new Error("The current round is not complete.");
                if (getPlayer(game, userId)?.seat !== 0) throw new Error("Only the first seat can start the next round.");
                startNextRound(game);
                callback({ success: true });
                io.to(game.roomCode).emit("uno:round-started", { round: game.round });
                emitPlayerStates(io, game);
                return;
            }

            const result = applyAction(game, userId, action, payload || {});
            callback({ success: true });
            emitActionEvent(io, game, result);
            emitPlayerStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            socket.emit("uno:error", { message: error.message });
        }
    });

    socket.on("uno:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const normalized = roomCode.toUpperCase();
            const game = games.get(getGameKey(normalized));
            if (!game) throw new Error("UNO game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) throw new Error("Invalid player identity.");

            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;
            reconnectPlayer(game, userId, socket.id);
            updatePlayerSocket(normalized, userId, socket.id);

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

        const player = getPlayer(game, userId);
        if (player?.socketId && player.socketId !== socket.id) return;

        markPlayerDisconnected(game, userId);
        emitPlayerStates(io, game);
    });
}
