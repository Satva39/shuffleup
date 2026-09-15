export const GAME_ID = "bluff";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const CHALLENGE_WINDOW_MS = 6000;
export const MAX_CARDS_PER_CLAIM = 4;

export const STATUS = Object.freeze({
    PLAYING: "playing",
    COMPLETE: "complete",
});

export const PHASE = Object.freeze({
    PLAY: "play",
    CHALLENGE: "challenge",
    FINAL_CHALLENGE: "final-challenge",
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

export function validatePlayerCount(count) {
    return Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}

export function rankIndex(rank) {
    return RANKS.indexOf(rank);
}

export function nextRank(rank) {
    const index = rankIndex(rank);
    if (index < 0) return RANKS[0];
    return RANKS[(index + 1) % RANKS.length];
}

export function isValidClaimCount(count) {
    return Number.isInteger(count) && count >= 1 && count <= MAX_CARDS_PER_CLAIM;
}
