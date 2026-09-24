const suitSymbols = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };

export default function PlayingCard({
  card,
  selected,
  onClick,
  small = false,
  faceDown = false,
}) {
  if (faceDown)
    return (
      <div
        className={`rummy-card rummy-card-back game-card-motion ${small ? "small" : ""}`}
      />
    );
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <button
      type="button"
      className={`rummy-card game-card-motion ${selected ? "selected" : ""} ${small ? "small" : ""} ${red ? "red" : ""}`}
      onClick={onClick}
    >
      <span>{card.rank}</span>
      <strong>{card.printedJoker ? "★" : suitSymbols[card.suit]}</strong>
    </button>
  );
}
