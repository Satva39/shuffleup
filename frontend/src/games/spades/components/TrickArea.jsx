import React from "react";
import { cardLabel } from "../logic/cards";

export default function TrickArea({ trick = [], trickCount = 0, winnerSeat }) {
    return (
        <section className="spades-trick-area">
            <div className="trick-header">
                <div>
                    <span className="eyebrow">CURRENT TRICK</span>
                    <strong>{Math.min(trickCount + 1, 13)} / 13</strong>
                </div>
                {winnerSeat && <span className="last-winner">Winner · {winnerSeat}</span>}
            </div>

            <div className="trick-cards">
                {trick.length ? (
                    trick.map((play) => (
                        <div className="played-card" key={`${play.playerId}-${play.card.id}`}>
                            <span>{play.seat}</span>
                            <strong>{cardLabel(play.card)}</strong>
                        </div>
                    ))
                ) : (
                    <div className="trick-empty">
                        <span className="trick-symbol">♠</span>
                        <span>Play a card to start the trick</span>
                    </div>
                )}
            </div>
        </section>
    );
}
