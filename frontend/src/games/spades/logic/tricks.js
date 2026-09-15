export function playerCardCount(players, playerId) {
    return players.find((player) => player.id === playerId)?.cardCount || 0;
}
