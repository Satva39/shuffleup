import React from "react";
import PlayingCard from "./PlayingCard";

export default function PlayerHand({ hand = [], selectedIds = [], selectableIds = [], disabled = false, onToggle }) {
    return (
        <div className="bluff-hand" aria-label="Your hand">
            {hand.map((card) => {
                const selectable = selectableIds.includes(card.id);
                return (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        selected={selectedIds.includes(card.id)}
                        disabled={disabled || !selectable}
                        onClick={onToggle}
                    />
                );
            })}
        </div>
    );
}
