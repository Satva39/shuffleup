export function findPlayer(state, playerId) {
    return state?.players?.find((player) => player.id === playerId) || null;
}

export function currentPlayer(state) {
    return findPlayer(state, state?.currentPlayerId);
}
