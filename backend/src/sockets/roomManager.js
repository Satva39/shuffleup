const rooms = new Map();

import { GAME_LIMITS, ROOM_STATUS } from "../../../shared/constants/platform.js";

function generateRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return code;
}

function createRoom(gameId, player) {
    if (!GAME_LIMITS[gameId]) {
        throw new Error("Invalid game.");
    }

    let code;

    do {
        code = generateRoomCode();
    } while (rooms.has(code));

    const room = {
        code,
        gameId,
        hostId: player.id,
        status: ROOM_STATUS.WAITING,
        createdAt: Date.now(),
        players: [
            {
                id: player.id,
                username: player.username,
                ready: false,
                socketId: null,
                connected: true,
            }
        ],
    };

    rooms.set(code, room);

    return room;
}

function getRoom(code) {
    return rooms.get(code.toUpperCase());
}

function addPlayer(code, player) {
    const room = getRoom(code);

    if (!room) {
        throw new Error("Room not found.");
    }

    if (room.status !== ROOM_STATUS.WAITING) {
        throw new Error("This game has already started.");
    }

    if (room.players.some((item) => item.id === player.id)) {
        return room;
    }

    const limits = GAME_LIMITS[room.gameId];

    if (room.players.length >= limits.max) {
        throw new Error("Room is full.");
    }

    room.players.push({
        id: player.id,
        username: player.username,
        ready: false,
        socketId: null,
        connected: true,
    });

    return room;
}

function removePlayer(code, playerId) {
    const room = getRoom(code);

    if (!room) {
        return null;
    }

    room.players = room.players.filter(
        (player) => player.id !== playerId
    );

    if (room.players.length === 0) {
        rooms.delete(room.code);
        return null;
    }

    if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
    }

    return room;
}

function setPlayerReady(code, playerId, ready) {
    const room = getRoom(code);

    if (!room) {
        throw new Error("Room not found.");
    }

    const player = room.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        throw new Error("Player not found.");
    }

    player.ready = ready;

    return room;
}

function startRoom(code, playerId) {
    const room = getRoom(code);

    if (!room) {
        throw new Error("Room not found.");
    }

    if (room.hostId !== playerId) {
        throw new Error("Only the host can start the game.");
    }

    const limits = GAME_LIMITS[room.gameId];

    if (room.players.length < limits.min) {
        throw new Error(
            `At least ${limits.min} players are required.`
        );
    }

    const allReady = room.players.every(
        (player) => player.ready || player.id === room.hostId
    );

    if (!allReady) {
        throw new Error(
            "Every player must be ready before starting."
        );
    }

    room.status = ROOM_STATUS.PLAYING;

    return room;
}

function getGameLimit(gameId) {
    return GAME_LIMITS[gameId];
}

function updatePlayerSocket(code, playerId, socketId) {
    const room = getRoom(code);

    if (!room) {
        return null;
    }

    const player = room.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        return null;
    }

    player.socketId = socketId;
    player.connected = true;

    return room;
}

function markPlayerDisconnected(code, playerId, socketId) {
    const room = getRoom(code);

    if (!room) {
        return null;
    }

    const player = room.players.find(
        (item) => item.id === playerId
    );

    if (!player) {
        return room;
    }

    /*
     * Do not disconnect a newer connection.
     */
    if (
        player.socketId &&
        player.socketId !== socketId
    ) {
        return room;
    }

    player.connected = false;

    return room;
}

function removeDisconnectedPlayer(code, playerId) {
    const room = getRoom(code);

    if (!room) {
        return null;
    }

    const player = room.players.find(
        (item) => item.id === playerId
    );

    if (!player || player.connected) {
        return room;
    }

    room.players = room.players.filter(
        (item) => item.id !== playerId
    );

    if (room.players.length === 0) {
        rooms.delete(room.code);
        return null;
    }

    if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
    }

    return room;
}

export {
    createRoom,
    getRoom,
    addPlayer,
    removePlayer,
    setPlayerReady,
    startRoom,
    getGameLimit,
    updatePlayerSocket,
    markPlayerDisconnected,
    removeDisconnectedPlayer,
};