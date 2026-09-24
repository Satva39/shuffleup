import { SUIT_SYMBOL } from "../logic/cards";

export default function PlayingCard({
  card,
  selectable = false,
  selected = false,
  disabled = false,
  onClick,
}) {
  const red = card?.suit === "H" || card?.suit === "D";
  return (
    <button
      type="button"
      className={`twenty-nine-card game-card-motion${red ? " is-red" : ""}${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
      disabled={disabled}
      onClick={selectable && !disabled ? onClick : undefined}
      aria-label={card ? `${card.rank} of ${card.suit}` : "card"}
    >
      <span className="twenty-nine-card-rank">{card?.rank}</span>
      <span className="twenty-nine-card-suit">
        {SUIT_SYMBOL[card?.suit] || ""}
      </span>
    </button>
  );
}
