import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createMindiCoatGame,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCard,
    revealHukum,
    selectTrumpCard,
    startNextHand,
} from "./mindiCoatEngine.js";

const games = new Map();

function key(roomCode) {
    return String(roomCode).toUpperCase();
}

function getGame(roomCode) {
    return games.get(key(roomCode));
}

function emitStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) {
            io.to(player.socketId).emit("mindi-coat:state", getPrivateState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("mindi-coat:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("mindi-coat:error", { message });
}

function assertIdentity(socket, roomCode, userId) {
    if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
    if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");
}

export function setupMindiCoatSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("mindi-coat:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== "mindi-coat") throw new Error("Mindi Coat room not found.");
            if (room.players.length !== 4) throw new Error("Mindi Coat requires exactly four players.");
            if (!room.players.some((player) => player.id === userId)) throw new Error("You are not part of this Mindi Coat room.");
            if (room.status !== "playing") throw new Error("The Mindi Coat game has not started.");

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createMindiCoatGame(room);
                games.set(normalized, game);
            }

            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("Mindi Coat player not found.");
            updatePlayerSocket(normalized, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            io.to(game.roomCode).emit("mindi-coat:deal", { handNumber: game.handNumber, dealer: game.dealer, leaderSeat: game.leaderSeat });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("mindi-coat:trump-select", ({ roomCode, userId, cardId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game not found.");
            assertIdentity(socket, roomCode, userId);
            const result = selectTrumpCard(game, userId, cardId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("mindi-coat:trump-selected", { seat: result.seat, playerId: result.selectedBy });
            io.to(game.roomCode).emit("mindi-coat:trick-start", { trickNumber: 1, leaderSeat: game.leaderSeat });
            io.to(game.roomCode).emit("mindi-coat:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("mindi-coat:open-hukum", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game not found.");
            assertIdentity(socket, roomCode, userId);
            const result = revealHukum(game, userId);
            callback({ success: true, result });

            io.to(game.roomCode).emit("mindi-coat:trump-reveal", {
                suit: result.suit,
                card: result.card,
                openedById: result.openedById,
                originalOwnerId: result.originalOwnerId,
            });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("mindi-coat:play-card", ({ roomCode, userId, cardId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game not found.");
            assertIdentity(socket, roomCode, userId);
            const result = playCard(game, userId, cardId);
            callback({ success: true, result });

            io.to(game.roomCode).emit("mindi-coat:card-played", {
                playerId: userId,
                sourceSeat: result.sourceSeat,
                card: result.card,
            });

            if (result.trickComplete) {
                io.to(game.roomCode).emit("mindi-coat:key-card-captured", {
                    winnerSeat: result.winnerSeat,
                    tensCaptured: result.tensCaptured,
                });
                io.to(game.roomCode).emit("mindi-coat:trick-complete", {
                    winnerSeat: result.winnerSeat,
                    completedTricks: result.completedTricks,
                });
            }

            if (result.handComplete) {
                io.to(game.roomCode).emit("mindi-coat:hand-complete", result.handResult);
                if (result.handResult?.coat) {
                    io.to(game.roomCode).emit("mindi-coat:coat", {
                        winningTeam: result.handResult.winnerTeam,
                        tens: result.handResult.tens,
                    });
                }
                io.to(game.roomCode).emit("mindi-coat:score-update", { scores: game.scores });
            }

            if (game.status === "game-complete") {
                io.to(game.roomCode).emit("mindi-coat:game-complete", { winnerTeam: game.winnerTeam, scores: game.scores });
            } else if (game.phase === "trick-play") {
                io.to(game.roomCode).emit("mindi-coat:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
                io.to(game.roomCode).emit("mindi-coat:trick-start", { trickNumber: game.completedTricks.length + 1, leaderSeat: game.currentSeat });
            }

            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("mindi-coat:next-hand", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game not found.");
            assertIdentity(socket, roomCode, userId);
            const updated = startNextHand(game, userId);
            callback({ success: true, handNumber: updated.handNumber });
            io.to(game.roomCode).emit("mindi-coat:next-hand", { handNumber: game.handNumber });
            io.to(game.roomCode).emit("mindi-coat:deal", { handNumber: game.handNumber, dealer: game.dealer, leaderSeat: game.leaderSeat });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("mindi-coat:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) throw new Error("Invalid player identity.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this Mindi Coat game.");
            markPlayerConnection(game, userId, true, socket.id);
            updatePlayerSocket(game.roomCode, userId, socket.id);
            socket.join(game.roomCode);
            socket.data.roomCode = game.roomCode;
            socket.data.userId = userId;
            callback({ success: true, state: getPrivateState(game, userId) });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("mindi-coat:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Mindi Coat game state not found.");
            if (!getGamePlayer(game, userId)) throw new Error("You are not part of this Mindi Coat game.");
            callback({ success: true, state: getPrivateState(game, userId) });
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("disconnect", () => {
        const roomCode = socket.data.roomCode;
        const userId = socket.data.userId;
        if (!roomCode || !userId) return;
        const game = getGame(roomCode);
        if (!game) return;
        const player = getGamePlayer(game, userId);
        if (!player || (player.socketId && player.socketId !== socket.id)) return;
        markPlayerConnection(game, userId, false, player.socketId);
        emitStates(io, game);
    });
}
