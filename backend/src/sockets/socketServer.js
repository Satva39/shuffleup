import jwt from "jsonwebtoken";

import {
    createRoom,
    getRoom,
    addPlayer,
    removePlayer,
    setPlayerReady,
    startRoom,
    updatePlayerSocket,
    markPlayerDisconnected,
    removeDisconnectedPlayer,
} from "./roomManager.js";
import { assertAuthenticatedSocket, assertSocketPlayer, assertSocketRoom } from "./socketGuards.js";

import {
    setupKachufulSocket,
} from "../games/kachuful/kachufulSocket.js";

import {
    setupTeenPattiSocket,
} from "../games/teen-patti/teenPattiSocket.js";

import {
    setupIndianRummySocket,
} from "../games/indian-rummy/indianRummySocket.js";

import {
    setupMangooseSocket,
} from "../games/mangoose/mangooseSocket.js";

import {
    setupUnoSocket,
} from "../games/uno/unoSocket.js";

import {
    setupJackThiefSocket,
} from "../games/jack-thief/jackThiefSocket.js";

import {
    setupNapoleonSocket,
} from "../games/napoleon/napoleonSocket.js";

import {
    setupBridgeSocket,
} from "../games/bridge/bridgeSocket.js";

import {
    setupSpadesSocket,
} from "../games/spades/spadesSocket.js";

import {
    setupTwentyNineSocket,
} from "../games/twenty-nine/twentyNineSocket.js";

import {
    setupMindiCoatSocket,
} from "../games/mindi-coat/mindiCoatSocket.js";

import {
    setupBluffSocket,
} from "../games/bluff/bluffSocket.js";

import {
    setupSattePeSattaSocket,
} from "../games/satte-pe-satta/sattePeSattaSocket.js";

import {
    setupWarSocket,
} from "../games/war/warSocket.js";

import {
    setupSolitaireSocket,
} from "../games/solitaire/solitaireSocket.js";

function setupSocket(io) {
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required."));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.data.authUserId = decoded.id;
            socket.data.authUsername = decoded.username;
            next();
        } catch {
            next(new Error("Invalid or expired authentication token."));
        }
    });

    io.on("connection", (socket) => {
        console.log("Player connected:", socket.id);

        setupKachufulSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupTeenPattiSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupIndianRummySocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupMangooseSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupUnoSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupJackThiefSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupNapoleonSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupBridgeSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupSpadesSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupTwentyNineSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupMindiCoatSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupBluffSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupSattePeSattaSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupWarSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        setupSolitaireSocket(io, socket, {
            getRoom,
            updatePlayerSocket,
        });

        socket.on("create-room", ({ gameId }, callback) => {
            try {
                const userId = assertAuthenticatedSocket(socket);
                const username = socket.data.authUsername;

                const room = createRoom(gameId, {
                    id: userId,
                    username,
                });

                socket.join(room.code);
                socket.data.roomCode = room.code;
                socket.data.userId = userId;

                updatePlayerSocket(
                    room.code,
                    userId,
                    socket.id
                );

                callback({
                    success: true,
                    room,
                });

                io.to(room.code).emit("room-updated", room);
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        });

        socket.on("join-room", ({ roomCode }, callback) => {
            try {
                const userId = assertAuthenticatedSocket(socket);
                const username = socket.data.authUsername;

                const room = addPlayer(roomCode, {
                    id: userId,
                    username,
                });

                socket.join(room.code);
                socket.data.roomCode = room.code;
                socket.data.userId = userId;

                updatePlayerSocket(
                    room.code,
                    userId,
                    socket.id
                );

                callback({
                    success: true,
                    room,
                });

                io.to(room.code).emit("room-updated", room);
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        });

        socket.on("toggle-ready", ({ roomCode }, callback) => {
            try {
                const userId = assertSocketPlayer(socket, socket.data.userId);
                assertSocketRoom(socket, roomCode);
                const room = getRoom(roomCode);

                if (!room) {
                    throw new Error("Room not found.");
                }

                const player = room.players.find(
                    (item) => item.id === userId
                );

                if (!player) {
                    throw new Error("Player not found.");
                }

                const updatedRoom = setPlayerReady(
                    roomCode,
                    userId,
                    !player.ready
                );

                callback({
                    success: true,
                    room: updatedRoom,
                });

                io.to(updatedRoom.code).emit(
                    "room-updated",
                    updatedRoom
                );
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        });

        socket.on("start-game", ({ roomCode }, callback) => {
            try {
                const userId = assertSocketPlayer(socket, socket.data.userId);
                assertSocketRoom(socket, roomCode);
                const room = startRoom(roomCode, userId);

                callback({
                    success: true,
                    room,
                });

                io.to(room.code).emit("game-started", room);
            } catch (error) {
                callback({
                    success: false,
                    message: error.message,
                });
            }
        });

        socket.on("leave-room", ({ roomCode }) => {
            const userId = assertSocketPlayer(socket, socket.data.userId);
            assertSocketRoom(socket, roomCode);
            const room = removePlayer(roomCode, userId);

            socket.leave(roomCode);

            if (room) {
                io.to(room.code).emit("room-updated", room);
            }
        });

        socket.on("disconnect", () => {
            const roomCode = socket.data.roomCode;
            const userId = socket.data.userId;

            if (!roomCode || !userId) {
                console.log(
                    "Player disconnected:",
                    socket.id
                );

                return;
            }

            const room = markPlayerDisconnected(
                roomCode,
                userId,
                socket.id
            );

            if (!room) {
                return;
            }

            io.to(room.code).emit(
                "room-updated",
                room
            );

            /*
             * Give the player a short grace period.
             * This handles normal browser refreshes/reconnections.
             */
            if (
                room.gameId === "kachuful" ||
                room.gameId === "teen-patti" ||
                room.gameId === "indian-rummy" ||
                room.gameId === "mangoose" ||
                room.gameId === "uno" ||
                room.gameId === "jack-thief" ||
                room.gameId === "napoleon" ||
                room.gameId === "bridge" ||
                room.gameId === "spades" ||
                room.gameId === "twenty-nine" ||
                room.gameId === "mindi-coat" ||
                room.gameId === "bluff" ||
                room.gameId === "satte-pe-satta" ||
                room.gameId === "war" ||
                room.gameId === "solitaire"
            ) {
                return;
            }

            setTimeout(() => {
                const updatedRoom =
                    removeDisconnectedPlayer(
                        roomCode,
                        userId
                    );

                if (updatedRoom) {
                    io.to(updatedRoom.code).emit(
                        "room-updated",
                        updatedRoom
                    );
                }
            }, 15000);

            console.log(
                "Player disconnected:",
                socket.id
            );
        });

    });
}

export default setupSocket;