export function getPlayer(gameState, playerId) {
    return gameState?.players?.find((player) => player.id === playerId) || null;
}

export function getOpponents(gameState, playerId) {
    return (gameState?.players || []).filter((player) => player.id !== playerId);
}

export function getCurrentPlayer(gameState) {
    return getPlayer(gameState, gameState?.currentPlayerId);
}

export function isMyTurn(gameState, playerId) {
    return gameState?.currentPlayerId === playerId && gameState.status === "playing";
}
