import { assertSocketPlayer } from "../../sockets/socketGuards.js";
import {
    createBridgeGame,
    getGamePlayer,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCard,
    startNextDeal,
    submitBid,
} from "./bridgeEngine.js";

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
            io.to(player.socketId).emit("bridge:state", getPrivateState(game, player.id));
        }
    }
    io.to(game.roomCode).emit("bridge:public-state", getPublicState(game));
}

function emitError(socket, message) {
    socket.emit("bridge:error", { message });
}

export function setupBridgeSocket(io, socket, { getRoom, updatePlayerSocket }) {
    socket.on("bridge:join", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const room = getRoom(roomCode);
            if (!room || room.gameId !== "bridge") throw new Error("Bridge room not found.");
            if (room.players.length !== 4) throw new Error("Bridge requires exactly four players.");
            if (!room.players.some((player) => player.id === userId)) throw new Error("You are not part of this Bridge room.");
            if (room.status !== "playing") throw new Error("The Bridge game has not started.");

            const normalized = room.code.toUpperCase();
            let game = getGame(normalized);
            if (!game) {
                game = createBridgeGame(room);
                games.set(normalized, game);
            }

            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("Bridge player not found.");

            updatePlayerSocket(normalized, userId, socket.id);
            player.socketId = socket.id;
            markPlayerConnection(game, userId, true, socket.id);

            socket.join(normalized);
            socket.data.roomCode = normalized;
            socket.data.userId = userId;
            callback({ success: true, state: getPrivateState(game, userId) });
            io.to(game.roomCode).emit("bridge:deal", { dealNumber: game.dealNumber, dealer: game.dealer, vulnerability: game.vulnerability });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on("bridge:bid", ({ roomCode, userId, action }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Bridge game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");
            const result = submitBid(game, userId, action || { type: "pass" });

            callback({ success: true, result });
            io.to(game.roomCode).emit("bridge:bid-submitted", result.entry);
            if (result.type === "auction-complete") {
                io.to(game.roomCode).emit("bridge:auction-complete", { contract: game.contract, passedOut: !game.contract });
                if (game.contract) {
                    io.to(game.roomCode).emit("bridge:contract", game.contract);
                    io.to(game.roomCode).emit("bridge:opening-lead", { seat: game.openingLeader });
                }
            }
            io.to(game.roomCode).emit("bridge:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("bridge:play-card", ({ roomCode, userId, cardId, sourceSeat }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Bridge game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            if (socket.data.roomCode?.toUpperCase() !== String(roomCode).toUpperCase()) throw new Error("Invalid room.");

            const result = playCard(game, userId, cardId, sourceSeat || null);
            callback({ success: true, result });
            io.to(game.roomCode).emit("bridge:card-played", {
                playerId: userId,
                sourceSeat: result.sourceSeat,
                card: result.card,
            });
            if (game.dummyRevealed && game.phase === "trick-play" && game.trick.length === 1 && game.completedTricks.length === 0) {
                io.to(game.roomCode).emit("bridge:dummy-reveal", { seat: game.contract.dummy });
            }
            if (game.lastTrickWinner) {
                io.to(game.roomCode).emit("bridge:trick-complete", {
                    winnerSeat: game.lastTrickWinner,
                    completedTricks: game.completedTricks.length,
                });
            }
            if (game.status === "round-complete") {
                io.to(game.roomCode).emit("bridge:deal-complete", game.result);
                io.to(game.roomCode).emit("bridge:round-complete", game.result);
            }
            if (game.status === "playing") {
                io.to(game.roomCode).emit("bridge:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            }
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("bridge:next-deal", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Bridge game not found.");
            if (socket.data.userId !== userId) throw new Error("Invalid player identity.");
            const player = getGamePlayer(game, userId);
            if (!player || player.seat !== game.dealer) throw new Error("Only the dealer may start the next deal.");
            startNextDeal(game);
            callback({ success: true });
            io.to(game.roomCode).emit("bridge:next-deal", { dealNumber: game.dealNumber });
            io.to(game.roomCode).emit("bridge:deal", { dealNumber: game.dealNumber, dealer: game.dealer, vulnerability: game.vulnerability });
            io.to(game.roomCode).emit("bridge:turn", { seat: game.currentSeat, actorId: game.turnActorId, phase: game.phase });
            emitStates(io, game);
        } catch (error) {
            callback({ success: false, message: error.message });
            emitError(socket, error.message);
        }
    });

    socket.on("bridge:reconnect", ({ roomCode, userId }, callback) => {
        try {
            assertSocketPlayer(socket, userId);
            const game = getGame(roomCode);
            if (!game) throw new Error("Bridge game state not found.");
            if (socket.data.userId && socket.data.userId !== userId) throw new Error("Invalid player identity.");
            const player = getGamePlayer(game, userId);
            if (!player) throw new Error("You are not part of this Bridge game.");
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

    socket.on("bridge:state", ({ roomCode, userId }, callback) => {
        try {
            const game = getGame(roomCode);
            if (!game) throw new Error("Bridge game state not found.");
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
