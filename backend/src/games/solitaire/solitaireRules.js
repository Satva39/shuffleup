export const GAME_ID = "solitaire";
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const DECK_SIZE = 52;
export const TABLEAU_COLUMNS = 7;
export const FOUNDATION_PILES = 4;
export const DRAW_COUNT = 1;
export const MAX_REDEALS = Infinity;

export const SUITS = [
    { code: "S", symbol: "♠", color: "black" },
    { code: "H", symbol: "♥", color: "red" },
    { code: "D", symbol: "♦", color: "red" },
    { code: "C", symbol: "♣", color: "black" },
];

export const RANKS = [
    { rank: "A", value: 1 },
    { rank: "2", value: 2 },
    { rank: "3", value: 3 },
    { rank: "4", value: 4 },
    { rank: "5", value: 5 },
    { rank: "6", value: 6 },
    { rank: "7", value: 7 },
    { rank: "8", value: 8 },
    { rank: "9", value: 9 },
    { rank: "10", value: 10 },
    { rank: "J", value: 11 },
    { rank: "Q", value: 12 },
    { rank: "K", value: 13 },
];

export const STATUS = {
    PLAYING: "playing",
    COMPLETE: "complete",
};

export const PLAYER_STATUS = {
    PLAYING: "PLAYING",
    COMPLETE: "COMPLETE",
    DISCONNECTED: "DISCONNECTED",
};

export function rankValue(rank) {
    return RANKS.find((item) => item.rank === rank)?.value || 0;
}

export function isRedSuit(suit) {
    return suit === "H" || suit === "D";
}

export function isSameColor(firstSuit, secondSuit) {
    return isRedSuit(firstSuit) === isRedSuit(secondSuit);
}
