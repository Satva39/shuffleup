export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const TOTAL_ROUNDS = 11;

export const PLAYER_STATUS = {
    ACTIVE: "active",
    FOLDED: "folded",
    DISCONNECTED: "disconnected",
    WINNER: "winner",
};

export const GAME_STATUS = {
    DEALING: "dealing",
    PLAYING: "playing",
    ROUND_COMPLETE: "round-complete",
    COMPLETE: "complete",
};

export const ACTIONS = {
    FOLD: "fold",
    PLAY: "play",
    NEXT_ROUND: "next-round",
};

export function isValidPlayerCount(count) {
    return (
        Number.isInteger(count) &&
        count >= MIN_PLAYERS &&
        count <= MAX_PLAYERS
    );
}

export function isValidAction(action) {
    return Object.values(ACTIONS).includes(action);
}

export function isPlayerActive(player) {
    return player?.status === PLAYER_STATUS.ACTIVE;
}

export function isPlayerFolded(player) {
    return player?.status === PLAYER_STATUS.FOLDED;
}

export function isPlayerDisconnected(player) {
    return player?.status === PLAYER_STATUS.DISCONNECTED;
}

export function isGameComplete(gameState) {
    return gameState?.status === GAME_STATUS.COMPLETE;
}