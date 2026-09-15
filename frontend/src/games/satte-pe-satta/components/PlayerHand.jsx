import React from "react";
import PlayingCard from "./PlayingCard";

export default function PlayerHand({ hand = [], legalMoves = [], onPlayCard, disabled }) {
    const legal = new Set(legalMoves);
    const sorted = [...hand].sort((a, b) => (a.suit + a.value).localeCompare(b.suit + b.value));

    return (
        <section className="sps-hand-panel">
            <div className="sps-section-heading">
                <div>
                    <span>YOUR HAND</span>
                    <strong>{hand.length} cards</strong>
                </div>
                <span className="sps-hand-tip">{legalMoves.length ? "Highlighted cards are playable" : "No legal move — pass"}</span>
            </div>
            <div className="sps-hand">
                {sorted.map((card) => (
                    <PlayingCard
                        key={card.id}
                        card={card}
                        playable={!disabled && legal.has(card.id)}
                        onClick={() => onPlayCard(card.id)}
                    />
                ))}
            </div>
        </section>
    );
}
