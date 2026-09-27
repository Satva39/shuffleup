export function getPlayableCardIds(cards, currentTrick) {
  if (!Array.isArray(cards) || cards.length === 0) return new Set();
  if (!Array.isArray(currentTrick) || currentTrick.length === 0) {
    return new Set(cards.map((card) => card.id));
  }

  const leadingSuit = currentTrick[0]?.card?.suit;
  if (!leadingSuit) return new Set(cards.map((card) => card.id));

  const hasLeadingSuit = cards.some((card) => card.suit === leadingSuit);
  if (!hasLeadingSuit) return new Set(cards.map((card) => card.id));

  return new Set(
    cards.filter((card) => card.suit === leadingSuit).map((card) => card.id),
  );
}

export function suitSymbol(suit) {
  return (
    {
      spades: "♠",
      diamonds: "♦",
      clubs: "♣",
      hearts: "♥",
    }[suit] || "?"
  );
}

export function suitColor(suit) {
  return suit === "diamonds" || suit === "hearts" ? "#FF6278" : "#111827";
}
