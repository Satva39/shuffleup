import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createTwentyNineGame,
    getGamePlayer,
    getLegalCardIds,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCard,
    selectTrump,
    startNextHand,
    submitBid,
} from "./twentyNineEngine.js";

const games = new Map();

function key(roomCode) {
    return String(roomCode).toUpperCase();
}

function getGame(roomCode) {
    return games.get(key(roomCode));
}

function emitStates(io, game) {
    for (const player of game.players) {
        if (player.socketId) io.to(player.socketId).emit("twenty-nine:state", getPrivateState(game, player.id));
    }
    io.to(game.roomCode).emit("twenty-nine:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("twenty-nine:error", { message });
}

function ensureSocketOwnsPlayer(socket, roomCode, userId) {
    if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
    if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");
}

export function setupTwentyNineSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("twenty-nine:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== "twenty-nine") throw new Error("Twenty-Nine room not found.");
            if (room.players.length !== 4) throw new Error("Twenty-Nine requires exactly four players.");
            if (!room.players.some((player) => player.id === userId)) throw new Error("You are not part of this Twenty-Nine room.");
            if (room.status !== "playing") throw new Error("The Twenty-Nine game has not started.");

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createTwentyNineGame(room);
                games.set(normalized, game);
            }

            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("Twenty-Nine player not found.");

            updatePlayerSocket(normalized, userId, socket.id);
            markPlayerConnection(game, userId, true, socket.id);
            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;

            callback({ success: true, state: getPrivateState(game, userId) });
            io.to(normalized).emit("twenty-nine:join", { playerId: userId, seat: player.seat });
            io.to(normalized).emit("twenty-nine:deal", { handNumber: game.handNumber, dealer: game.dealer, initialCards: 4 });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("twenty-nine:bid", ({ roomCode, userId, bid }, callback) => {
        try {
            ensureSocketOwnsPlayer(socket, roomCode, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game not found.");
            const result = submitBid(game, userId, bid);
            callback({ success: true, result });
            io.to(game.roomCode).emit("twenty-nine:bid-submitted", result.entry);
            io.to(game.roomCode).emit("twenty-nine:auction-update", { highestBid: game.highestBid, bidderId: game.bidderId, history: game.auctionHistory });
            if (result.type === "auction-complete") {
                io.to(game.roomCode).emit("twenty-nine:auction-complete", {
                    bidderId: game.bidderId,
                    bid: game.highestBid,
                    team: game.bidTeam,
                    forced: Boolean(result.forced),
                });
                io.to(game.roomCode).emit("twenty-nine:trump", { phase: "selection", bidderId: game.bidderId });
            }
            io.to(game.roomCode).emit("twenty-nine:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("twenty-nine:trump", ({ roomCode, userId, suit }, callback) => {
        try {
            ensureSocketOwnsPlayer(socket, roomCode, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game not found.");
            const result = selectTrump(game, userId, suit);
            callback({ success: true, result });
            io.to(game.roomCode).emit("twenty-nine:trump", { phase: "selected", bidderId: userId });
            io.to(game.roomCode).emit("twenty-nine:deal", { handNumber: game.handNumber, dealer: game.dealer, remainingCards: 4 });
            io.to(game.roomCode).emit("twenty-nine:trick-start", { trickNumber: 1, leaderSeat: game.leaderSeat });
            io.to(game.roomCode).emit("twenty-nine:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("twenty-nine:play-card", ({ roomCode, userId, cardId }, callback) => {
        try {
            ensureSocketOwnsPlayer(socket, roomCode, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game not found.");
            const result = playCard(game, userId, cardId);
            callback({ success: true, result });
            io.to(game.roomCode).emit("twenty-nine:card-played", {
                playerId: userId,
                sourceSeat: result.sourceSeat,
                card: result.card,
            });
            if (result.trumpJustRevealed) {
                io.to(game.roomCode).emit("twenty-nine:trump-reveal", { byPlayerId: userId, suit: game.trumpSuit });
            }
            if (result.trickComplete) {
                io.to(game.roomCode).emit("twenty-nine:trick-complete", {
                    winnerSeat: result.winnerSeat,
                    winnerTeam: result.winnerTeam,
                    completedTricks: result.completedTricks,
                });
            }
            if (result.handComplete) {
                io.to(game.roomCode).emit("twenty-nine:hand-complete", result.handResult);
                io.to(game.roomCode).emit("twenty-nine:score-update", { scores: game.scores, tricks: game.tricks });
            }
            if (game.status === "game-complete") {
                io.to(game.roomCode).emit("twenty-nine:game-complete", { winnerTeam: game.winnerTeam, scores: game.scores });
            } else if (game.phase === "trick-play") {
                io.to(game.roomCode).emit("twenty-nine:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
                io.to(game.roomCode).emit("twenty-nine:trick-start", { trickNumber: game.completedTricks.length + 1, leaderSeat: game.currentSeat });
            }
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("twenty-nine:next-hand", ({ roomCode, userId }, callback) => {
        try {
            ensureSocketOwnsPlayer(socket, roomCode, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game not found.");
            const updated = startNextHand(game, userId);
            callback({ success: true, handNumber: updated.handNumber });
            io.to(game.roomCode).emit("twenty-nine:next-hand", { handNumber: game.handNumber });
            io.to(game.roomCode).emit("twenty-nine:deal", { handNumber: game.handNumber, dealer: game.dealer, initialCards: 4 });
            io.to(game.roomCode).emit("twenty-nine:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("twenty-nine:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (socket.data.roomCode && socket.data.roomCode.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this Twenty-Nine game.");
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

    socket.on("twenty-nine:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Twenty-Nine game state not found.");
            ensureSocketOwnsPlayer(socket, roomCode, userId);
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
