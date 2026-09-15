export const GAME_ID = "war";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 2;
export const DECK_SIZE = 52;
export const WAR_FACE_DOWN_CARDS = 1;
export const BATTLE_REVEAL_DELAY_MS = 850;
export const WAR_REVEAL_DELAY_MS = 700;
export const NEXT_BATTLE_DELAY_MS = 1100;

export const STATUS = Object.freeze({
    PLAYING: "playing",
    COMPLETE: "complete",
});

export const PHASE = Object.freeze({
    READY: "ready",
    BATTLE_REVEAL: "battle-reveal",
    WAR: "war",
    WAR_REVEAL: "war-reveal",
    BATTLE_RESULT: "battle-result",
});

export const RANKS = Object.freeze([
    "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
]);

export const SUITS = Object.freeze([
    { code: "S", symbol: "♠", color: "black" },
    { code: "H", symbol: "♥", color: "red" },
    { code: "D", symbol: "♦", color: "red" },
    { code: "C", symbol: "♣", color: "black" },
]);

export const RANK_VALUES = Object.freeze(
    Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]))
);

export function validatePlayerCount(count) {
    return Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}

export function rankValue(rank) {
    return RANK_VALUES[rank] ?? 0;
}
