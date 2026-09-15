export const SUIT_SYMBOLS = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
};

export function cardLabel(card) {
    return card ? `${card.rank}${SUIT_SYMBOLS[card.suit] || card.symbol || ""}` : "";
}

export function isRed(card) {
    return card?.suit === "H" || card?.suit === "D";
}
