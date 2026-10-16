function normalizeRoomCode(roomCode) {
    return String(roomCode || "").trim().toUpperCase();
}

function assertAuthenticatedSocket(socket) {
    if (!socket.data.authUserId) {
        throw new Error("Authentication required.");
    }
    if (socket.data.isDemo && (!socket.data.demoExpiresAt || Date.now() >= socket.data.demoExpiresAt)) {
        throw new Error("Your two-minute demo has ended. Sign in or register to keep playing.");
    }
    return socket.data.authUserId;
}

function assertRegisteredSocket(socket) {
    assertAuthenticatedSocket(socket);
    if (socket.data.isDemo) {
        throw new Error("A registered account is required for multiplayer rooms and this feature.");
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
    assertRegisteredSocket,
    assertSocketPlayer,
    assertSocketRoom,
    bindSocketPlayer,
};
