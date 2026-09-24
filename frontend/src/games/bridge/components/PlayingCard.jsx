import { cardLabel, cardIsRed } from "../logic/cards";

export default function PlayingCard({
  card,
  selectable = false,
  selected = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`bridge-card game-card-motion ${cardIsRed(card) ? "is-red" : ""} ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
      disabled={!selectable || disabled}
      onClick={onClick}
      aria-label={cardLabel(card)}
    >
      <span>{card?.rank}</span>
      <span className="bridge-card-suit">
        {cardLabel(card).slice(String(card?.rank || "").length)}
      </span>
    </button>
  );
}
