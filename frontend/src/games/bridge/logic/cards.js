export const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAMES = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs", NT: "No Trump" };

export function cardLabel(card) {
    if (!card) return "";
    return `${card.rank}${SUIT_SYMBOLS[card.suit] || card.suit}`;
}

export function cardIsRed(card) {
    return card?.suit === "H" || card?.suit === "D";
}

export function sortCards(cards = []) {
    const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
    const rankValue = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };
    return [...cards].sort((a, b) => (suitOrder[a.suit] - suitOrder[b.suit]) || (rankValue[b.rank] - rankValue[a.rank]));
}
