import {
    GAME_STATUS,
    PLAYER_STATUS,
} from "./rules";

export function getActivePlayers(players = []) {
    return players.filter(
        (player) =>
            player.status === PLAYER_STATUS.ACTIVE
    );
}

export function getFoldedPlayers(players = []) {
    return players.filter(
        (player) =>
            player.status === PLAYER_STATUS.FOLDED
    );
}

export function getCurrentPlayer(players = [], currentPlayerId) {
    return (
        players.find(
            (player) =>
                player.id === currentPlayerId
        ) || null
    );
}

export function isMyTurn(
    gameState,
    userId
) {
    return (
        gameState?.status === GAME_STATUS.PLAYING &&
        gameState?.currentPlayerId === userId
    );
}

export function getPlayerById(players = [], userId) {
    return (
        players.find(
            (player) => player.id === userId
        ) || null
    );
}

export function getPlayerScore(
    players = [],
    userId
) {
    return (
        getPlayerById(players, userId)?.score || 0
    );
}

export function getGameProgress(gameState) {
    const round = gameState?.round || 1;
    const totalRounds =
        gameState?.totalRounds || 11;

    return {
        round,
        totalRounds,
        completed: gameState?.status === GAME_STATUS.COMPLETE,
    };
}