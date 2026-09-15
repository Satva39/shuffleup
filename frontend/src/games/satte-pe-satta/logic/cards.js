export const SUITS = ["spades", "hearts", "diamonds", "clubs"];
export const SUIT_SYMBOLS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const RANK_VALUES = Object.freeze({ A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 });

export function cardLabel(card) {
    return `${card.rank}${SUIT_SYMBOLS[card.suit] || ""}`;
}

export function isRedSuit(suit) {
    return suit === "hearts" || suit === "diamonds";
}
