import React from "react";
import { isRed, SUIT_SYMBOLS } from "../logic/cards";

export default function PlayingCard({ card, selected = false, disabled = false, onClick }) {
    if (!card) return null;
    return (
        <button
            type="button"
            className={`bluff-card game-card-motion ${isRed(card) ? "red" : "black"} ${selected ? "selected" : ""}`}
            disabled={disabled}
            onClick={() => onClick?.(card.id)}
            aria-label={`${card.rank}${SUIT_SYMBOLS[card.suit]}`}
        >
            <span className="bluff-card-corner">{card.rank}</span>
            <span className="bluff-card-suit">{SUIT_SYMBOLS[card.suit]}</span>
        </button>
    );
}
