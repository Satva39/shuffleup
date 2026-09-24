import React from "react";
import { SUIT_SYMBOLS, cardClass, cardName } from "../logic/cards";

export default function PlayingCard({
  card,
  disabled = false,
  selected = false,
  hidden = false,
  onClick,
}) {
  if (hidden) {
    return (
      <span
        className="mindi-card-back game-card-motion"
        aria-label="Hidden card"
      />
    );
  }
  if (!card) return null;
  return (
    <button
      type="button"
      className={`${cardClass(card)} game-card-motion ${selected ? "selected" : ""}`}
      disabled={disabled}
      onClick={() => onClick?.(card.id)}
      aria-label={cardName(card)}
    >
      <span className="mindi-card-rank">{card.rank}</span>
      <span className="mindi-card-suit">{SUIT_SYMBOLS[card.suit]}</span>
      {card.rank === "10" && <span className="mindi-card-mindi">M</span>}
    </button>
  );
}
