export const SUITS = [
    { key: "clubs", symbol: "♣", name: "Clubs" },
    { key: "diamonds", symbol: "♦", name: "Diamonds" },
    { key: "hearts", symbol: "♥", name: "Hearts" },
    { key: "spades", symbol: "♠", name: "Spades" },
];

export const RANKS = [
    "A", "K", "Q", "J", "10", "9", "8", "7",
    "6", "5", "4", "3", "2",
];

export function cardLabel(card) {
    if (!card) return "";
    const suit = SUITS.find((item) => item.key === card.suit);
    return `${card.rank}${suit?.symbol || ""}`;
}

export function isScoringCard(card) {
    return ["A", "K", "Q", "J", "10"].includes(card?.rank);
}

export function cardKey(card) {
    return card?.id || "";
}
