export const SUIT_SYMBOLS = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
};

export function isRedSuit(suit) {
    return suit === "hearts" || suit === "diamonds";
}
