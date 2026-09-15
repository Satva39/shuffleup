import { assertSocketPlayer, assertSocketRoom } from "../../sockets/socketGuards.js";
import {
    applyPlayerMove,
    ensureGame,
    getGame,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    drawStock,
    markPlayerConnection,
} from "./solitaireEngine.js";
import {
    GAME_ID,
    MAX_PLAYERS,
    MIN_PLAYERS,
} from "./solitaireRules.js";

function emitPublic(io, game) {
    io.to(game.roomCode).emit(
        "solitaire:progress",
        getPublicState(game)
    );
    io.to(game.roomCode).emit(
        "solitaire:ranking-update",
        getPublicState(game).rankings
    );
}

function sendError(socket, message) {
    socket.emit("solitaire:error", { message });
}

function authorizeRoom(room, roomCode, userId) {
    if (!room || room.gameId !== GAME_ID) {
        throw new Error("Solitaire room not found.");
    }

    if (
        room.players.length < MIN_PLAYERS ||
        room.players.length > MAX_PLAYERS
    ) {
        throw new Error(
            `Solitaire supports ${MIN_PLAYERS}-${MAX_PLAYERS} players.`
        );
    }

    if (!room.players.some((player) => player.id === userId)) {
        throw new Error("You are not part of this Solitaire room.");
    }

    if (room.status !== "playing") {
        throw new Error("The Solitaire game has not started.");
    }

    return room;
}

export function setupSolitaireSocket(
    io,
    socket,
    { getRoom, updatePlayerSocket }
) {
    socket.on("solitaire:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = authorizeRoom(
                getRoom(roomCode),
                roomCode,
                userId
            );

            const game = ensureGame(room);
            const player = getGamePlayer(game, userId);

            if (!player) {
                throw new Error("Solitaire player not found.");
            }

            updatePlayerSocket(room.code, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);

            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;

            const state = getPrivateState(game, userId);

            callback({
                success: true,
                state,
            });

            socket.emit("solitaire:state", state);
            emitPublic(io, game);
        } catch (error) {
            callback({
                success: false,
                message: error.message,
            });
        }
    });

    socket.on("solitaire:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);

            if (!game) {
                throw new Error("Solitaire game not found.");
            }

            const player = getGamePlayer(game, userId);

            if (!player) {
                throw new Error("You are not part of this Solitaire game.");
            }

            updatePlayerSocket(game.roomCode, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);

            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;

            callback({
                success: true,
                state: getPrivateState(game, userId),
            });

            emitPublic(io, game);
        } catch (error) {
            callback({
                success: false,
                message: error.message,
            });
        }
    });

    socket.on("solitaire:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);

            if (!game) {
                throw new Error("Solitaire game not found.");
            }

            callback({
                success: true,
                state: getPrivateState(game, userId),
            });
        } catch (error) {
            callback({
                success: false,
                message: error.message,
            });
        }
    });

    socket.on("solitaire:move", ({ roomCode, userId, move }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);

            if (!game) {
                throw new Error("Solitaire game not found.");
            }

            const state = applyPlayerMove(game, userId, move);

            callback({
                success: true,
                state,
            });

            socket.emit("solitaire:move-result", {
                success: true,
                state,
            });

            emitPublic(io, game);

            if (state.player.status === "COMPLETE") {
                io.to(game.roomCode).emit(
                    "solitaire:complete",
                    game.players.find((player) => player.id === userId)
                        ? {
                            playerId: userId,
                            username: game.players.find((player) => player.id === userId).username,
                            completionTime: game.players.find((player) => player.id === userId).completionSeconds,
                            score: game.players.find((player) => player.id === userId).score,
                        }
                        : null
                );
            }

            if (game.status === "complete") {
                io.to(game.roomCode).emit(
                    "solitaire:game-complete",
                    getPublicState(game)
                );
            }
        } catch (error) {
            callback({
                success: false,
                message: error.message,
            });
            sendError(socket, error.message);
        }
    });

    socket.on("solitaire:draw-stock", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            assertSocketRoom(socket, roomCode);
            const game = getGame(roomCode);

            if (!game) {
                throw new Error("Solitaire game not found.");
            }

            const state = drawStock(game, userId);

            callback({
                success: true,
                state,
            });

            socket.emit("solitaire:move-result", {
                success: true,
                state,
            });

            emitPublic(io, game);
        } catch (error) {
            callback({
                success: false,
                message: error.message,
            });
            sendError(socket, error.message);
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
        emitPublic(io, game);
    });
}
