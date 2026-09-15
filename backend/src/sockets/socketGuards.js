function normalizeRoomCode(roomCode) {
    return String(roomCode || "").trim().toUpperCase();
}

function assertAuthenticatedSocket(socket) {
    if (!socket.data.authUserId) {
        throw new Error("Authentication required.");
    }

    return socket.data.authUserId;
}

function assertSocketPlayer(socket, userId) {
    const authenticatedUserId = assertAuthenticatedSocket(socket);

    if (authenticatedUserId !== userId) {
        throw new Error("Invalid player identity.");
    }

    return authenticatedUserId;
}

function assertSocketRoom(socket, roomCode) {
    const normalized = normalizeRoomCode(roomCode);

    if (!normalized) {
        throw new Error("Invalid room.");
    }

    if (
        socket.data.roomCode &&
        normalizeRoomCode(socket.data.roomCode) !== normalized
    ) {
        throw new Error("Invalid room.");
    }

    return normalized;
}

function bindSocketPlayer(socket, roomCode, userId) {
    assertSocketPlayer(socket, userId);
    const normalized = assertSocketRoom(socket, roomCode);

    socket.data.roomCode = normalized;
    socket.data.userId = userId;

    return normalized;
}

export {
    normalizeRoomCode,
    assertAuthenticatedSocket,
    assertSocketPlayer,
    assertSocketRoom,
    bindSocketPlayer,
};
