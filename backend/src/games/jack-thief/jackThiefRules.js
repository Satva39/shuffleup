export const GAME_ID = "jack-thief";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;
export const TURN_TIMEOUT_MS = 18000;
export const REMOVED_CARD = "JH";

export const STATUS = Object.freeze({
    WAITING: "waiting",
    PLAYING: "playing",
    COMPLETE: "complete",
});

export const PLAYER_STATUS = Object.freeze({
    ACTIVE: "active",
    FINISHED: "finished",
    DISCONNECTED: "disconnected",
    LOSER: "loser",
});

export const RANKS = Object.freeze([
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
]);

export const SUITS = Object.freeze([
    { code: "S", symbol: "♠", color: "black" },
    { code: "H", symbol: "♥", color: "red" },
    { code: "D", symbol: "♦", color: "red" },
    { code: "C", symbol: "♣", color: "black" },
]);

export function sameRank(first, second) {
    return Boolean(first && second && first.rank === second.rank);
}

export function validatePlayerCount(count) {
    return Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}
