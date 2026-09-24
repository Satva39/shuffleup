export default function PlayingCard({
  card,
  selected = false,
  onClick,
  disabled = false,
  compact = false,
}) {
  if (!card) {
    return null;
  }

  if (!card.faceUp) {
    return (
      <button
        type="button"
        className={`solitaire-card game-card-motion solitaire-card-back ${compact ? "compact" : ""}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Face-down card"
      >
        <span className="card-back-pattern" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={[
        "solitaire-card",
        "game-card-motion",
        card.color === "red" ? "red-card" : "black-card",
        selected ? "selected" : "",
        compact ? "compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${card.rank}${card.symbol}`}
    >
      <span className="card-corner top-left">
        <strong>{card.rank}</strong>
        <span>{card.symbol}</span>
      </span>

      <span className="card-center-suit">{card.symbol}</span>

      <span className="card-corner bottom-right">
        <strong>{card.rank}</strong>
        <span>{card.symbol}</span>
      </span>
    </button>
  );
}
