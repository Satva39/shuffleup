export function playerById(state, playerId) {
    return state?.players?.find((player) => player.id === playerId) || null;
}

export function remainingSeconds(expiresAt) {
    if (!expiresAt) return 0;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}
