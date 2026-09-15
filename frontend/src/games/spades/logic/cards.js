export const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAMES = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUITS = ["C", "D", "H", "S"];

export function cardLabel(card) {
    return card ? `${card.rank}${SUIT_SYMBOLS[card.suit] || ""}` : "";
}

export function cardName(card) {
    return card ? `${card.rank} of ${SUIT_NAMES[card.suit] || card.suit}` : "";
}

export function cardClass(card) {
    return card?.suit === "H" || card?.suit === "D" ? "spades-card red" : "spades-card";
}
