export const SUIT_SYMBOLS = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
};

export const RANKS = [
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

export function isRed(card) {
    return card?.suit === "H" || card?.suit === "D";
}

export function cardLabel(card) {
    return `${card?.rank || "?"}${SUIT_SYMBOLS[card?.suit] || ""}`;
}
