import React from "react";
import { cardLabel, isRedSuit } from "../logic/cards";

export default function PlayingCard({
  card,
  playable = false,
  selected = false,
  onClick,
  compact = false,
}) {
  const className = [
    "sps-card",
    "game-card-motion",
    isRedSuit(card.suit) ? "sps-card--red" : "sps-card--black",
    playable ? "sps-card--playable" : "",
    selected ? "sps-card--selected" : "",
    compact ? "sps-card--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={!onClick || !playable}
      aria-label={cardLabel(card)}
      type="button"
    >
      <span className="sps-card-rank">{card.rank}</span>
      <span className="sps-card-suit">
        {card.suit === "spades"
          ? "♠"
          : card.suit === "hearts"
            ? "♥"
            : card.suit === "diamonds"
              ? "♦"
              : "♣"}
      </span>
    </button>
  );
}
