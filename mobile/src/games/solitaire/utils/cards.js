export const SUITS = [
  { code: "S", symbol: "♠", label: "SPADES", color: "black" },
  { code: "H", symbol: "♥", label: "HEARTS", color: "red" },
  { code: "D", symbol: "♦", label: "DIAMONDS", color: "red" },
  { code: "C", symbol: "♣", label: "CLUBS", color: "black" },
];

export const RANK_VALUES = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
};

export function rankValue(rank) {
  return RANK_VALUES[rank] || 0;
}

export function isRed(suit) {
  return suit === "H" || suit === "D";
}

export function canPlaceOnTableau(card, column) {
  if (!card || !Array.isArray(column)) return false;
  if (!column.length) return card.rank === "K";
  const destination = column[column.length - 1];
  if (!destination?.faceUp) return false;
  return (
    rankValue(destination.rank) === rankValue(card.rank) + 1 &&
    isRed(destination.suit) !== isRed(card.suit)
  );
}

export function canPlaceOnFoundation(card, pile) {
  if (!card || !Array.isArray(pile)) return false;
  if (!pile.length) return card.rank === "A";
  const top = pile[pile.length - 1];
  return (
    top?.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1
  );
}

export function seatLabel(seat) {
  return `P${seat || "?"}`;
}
