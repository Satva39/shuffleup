export const SUITS = ["spades", "hearts", "diamonds", "clubs"];

export const RANKS = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
];

export const RANK_VALUES = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
};

export const SUIT_SYMBOLS = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
};

export function createCard(rank, suit) {
    return {
        id: `${rank}-${suit}`,
        rank,
        suit,
        value: RANK_VALUES[rank],
    };
}