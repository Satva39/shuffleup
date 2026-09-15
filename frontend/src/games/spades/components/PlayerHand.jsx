import React from "react";
import PlayingCard from "./PlayingCard";

export default function PlayerHand({
    hand = [],
    legalCardIds = [],
    onPlayCard,
    disabled = false,
    seat = "S",
}) {
    const seatClass = `spades-hand-${String(seat).toLowerCase()}`;

    return (
        <div
            className={`spades-player-hand ${seatClass}`}
            aria-label="Your cards"
        >
            {hand.map((card) => {
                const legal = legalCardIds.includes(card.id);

                return (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        disabled={disabled || !legal}
                        onClick={onPlayCard}
                    />
                );
            })}
        </div>
    );
}
