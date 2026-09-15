export const SUITS = ["S", "H", "D", "C"];
export const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_LABEL = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
export const RANKS = ["J", "9", "A", "10", "K", "Q", "8", "7"];

export function cardLabel(card) {
    if (!card) return "";
    return `${card.rank}${SUIT_SYMBOL[card.suit] || card.suit}`;
}

export function sortHand(hand = []) {
    const suitOrder = { C: 0, D: 1, H: 2, S: 3 };
    const rankOrder = Object.fromEntries(RANKS.map((rank, index) => [rank, index]));
    return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankOrder[a.rank] - rankOrder[b.rank]);
}
