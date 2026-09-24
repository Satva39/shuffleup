import React from "react";
import { cardClass, SUIT_SYMBOLS } from "../logic/cards";

export default function PlayingCard({
  card,
  disabled = false,
  onClick,
  selected = false,
}) {
  if (!card) return null;

  const red = card.suit === "H" || card.suit === "D";

  return (
    <button
      type="button"
      className={`${cardClass(card)} spades-card game-card-motion ${red ? "red" : ""} ${selected ? "selected" : ""}`}
      disabled={disabled}
      onClick={() => onClick?.(card.id)}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
    </button>
  );
}
