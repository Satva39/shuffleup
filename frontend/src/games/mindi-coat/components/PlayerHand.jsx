import React from "react";
import PlayingCard from "./PlayingCard";

export default function PlayerHand({ hand, legalCardIds = [], onPlayCard, disabled = false, selectMode = false, selectedId }) {
    return (
        <div className={`mindi-player-hand ${selectMode ? "selection-mode" : ""}`}>
            {hand.map((card) => {
                const legal = selectMode || legalCardIds.includes(card.id);
                return (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        selected={selectedId === card.id}
                        disabled={disabled || !legal}
                        onClick={onPlayCard}
                    />
                );
            })}
        </div>
    );
}
