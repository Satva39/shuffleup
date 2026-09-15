export function isMyTurn(state, userId) {
    return Boolean(state && userId && state.currentPlayerId === userId && state.status === "playing");
}

export function getCurrentPlayerName(state) {
    return state?.players?.find((player) => player.id === state.currentPlayerId)?.username || "—";
}
