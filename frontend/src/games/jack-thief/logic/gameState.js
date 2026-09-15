export function getPlayer(state, playerId) {
    return state?.players?.find((player) => player.id === playerId) || null;
}

export function getTargetPlayer(state, playerId) {
    const targetId = state?.targetPlayerId;
    return state?.players?.find((player) => player.id === targetId) || null;
}

export function isMyTurn(state, userId) {
    return state?.status === "playing" && state?.currentPlayerId === userId;
}
