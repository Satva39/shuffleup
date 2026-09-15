export function getPlayer(
    gameState,
    playerId
) {
    return gameState?.players?.find(
        (player) => player.id === playerId
    );
}

export function getOpponents(
    gameState,
    playerId
) {
    return (
        gameState?.players?.filter(
            (player) => player.id !== playerId
        ) || []
    );
}

export function getSeatClass(
    playerCount,
    seat
) {
    return `mangoose-seat-${playerCount}-${seat}`;
}
