export const GAME_ID = "satte-pe-satta";
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const TARGET_SCORE = 100;
export const ROUND_COMPLETE_DELAY_MS = 2500;

export const STATUS = {
    PLAYING: "playing",
    ROUND_COMPLETE: "round-complete",
    COMPLETE: "complete",
};

export const SUITS = ["spades", "hearts", "diamonds", "clubs"];
export const SUIT_SYMBOLS = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
};

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const RANK_VALUES = Object.freeze({
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
});

export const STARTER_CARD_ID = "7-hearts";
export const CARD_POINTS = RANK_VALUES;

export function getPlayerLimits() {
    return { min: MIN_PLAYERS, max: MAX_PLAYERS };
}
