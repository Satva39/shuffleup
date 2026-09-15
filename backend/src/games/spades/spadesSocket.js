import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createSpadesGame,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCard,
    startNextHand,
    submitBid,
} from "./spadesEngine.js";

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
            io.to(player.socketId).emit("spades:state", getPrivateState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("spades:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("spades:error", { message });
}

export function setupSpadesSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("spades:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== "spades") throw new Error("Spades room not found.");
            if (room.players.length !== 4) throw new Error("Spades requires exactly four players.");
            if (!room.players.some((player) => player.id === userId)) throw new Error("You are not part of this Spades room.");
            if (room.status !== "playing") throw new Error("The Spades game has not started.");

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createSpadesGame(room);
                games.set(normalized, game);
            }

            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("Spades player not found.");

            updatePlayerSocket(normalized, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;
            callback({ success: true, state: getPrivateState(game, userId) });
            io.to(game.roomCode).emit("spades:deal", { handNumber: game.handNumber, dealer: game.dealer, leaderSeat: game.leaderSeat });
            io.to(game.roomCode).emit("spades:trick-start", { trickNumber: game.completedTricks.length + 1, leaderSeat: game.currentSeat });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("spades:bid", ({ roomCode, userId, bid }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Spades game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");
            const result = submitBid(game, userId, Number(bid));
            callback({ success: true, result });
            io.to(game.roomCode).emit("spades:bid-submitted", result.entry);
            if (result.type === "bidding-complete") {
                io.to(game.roomCode).emit("spades:bidding-complete", { bids: game.players.map((player) => ({ playerId: player.id, seat: player.seat, bid: player.bid })) });
                io.to(game.roomCode).emit("spades:trick-start", { trickNumber: 1, leaderSeat: game.leaderSeat });
            }
            io.to(game.roomCode).emit("spades:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("spades:play-card", ({ roomCode, userId, cardId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Spades game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");

            const previousBroken = game.spadesBroken;
            const result = playCard(game, userId, cardId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("spades:card-played", {
                playerId: userId,
                sourceSeat: result.sourceSeat,
                card: result.card,
            });
            if (!previousBroken && game.spadesBroken) {
                io.to(game.roomCode).emit("spades:spades-broken", { byPlayerId: userId, seat: result.sourceSeat });
            }
            if (result.trickComplete) {
                io.to(game.roomCode).emit("spades:trick-complete", {
                    winnerSeat: result.winnerSeat,
                    completedTricks: result.completedTricks,
                });
            }
            if (result.handComplete) {
                io.to(game.roomCode).emit("spades:hand-complete", result.handResult);
                io.to(game.roomCode).emit("spades:score-update", { scores: game.scores, bags: game.bags });
            }
            if (game.status === "game-complete") {
                io.to(game.roomCode).emit("spades:game-complete", { winnerTeam: game.winnerTeam, scores: game.scores });
            } else if (game.phase === "trick-play") {
                io.to(game.roomCode).emit("spades:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
                io.to(game.roomCode).emit("spades:trick-start", { trickNumber: game.completedTricks.length + 1, leaderSeat: game.currentSeat });
            }
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("spades:next-hand", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Spades game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            const updated = startNextHand(game, userId);
            callback({ success: true, handNumber: updated.handNumber });
            io.to(game.roomCode).emit("spades:next-hand", { handNumber: game.handNumber });
            io.to(game.roomCode).emit("spades:deal", { handNumber: game.handNumber, dealer: game.dealer, leaderSeat: game.leaderSeat });
            io.to(game.roomCode).emit("spades:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            io.to(game.roomCode).emit("spades:trick-start", { trickNumber: 1, leaderSeat: game.leaderSeat });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("spades:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Spades game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) throw new Error("Invalid player identity.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this Spades game.");
            player.socketId = socket.id;
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

    socket.on("spades:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Spades game state not found.");
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
