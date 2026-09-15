import React from "react";
import { SUIT_SYMBOLS } from "../logic/cards";

export default function TrickArea({ trick = [], trickCount = 0, winnerSeat }) {
    return (
        <section className="mindi-trick-area">
            <div className="mindi-trick-heading">
                <span>CURRENT TRICK</span>
                <small>
                    {Math.min(trickCount + 1, 13)} / 13
                    {winnerSeat ? ` · Winner ${winnerSeat}` : ""}
                </small>
            </div>

            <div className="mindi-trick-cards">
                {trick.length ? (
                    trick.map((play) => {
                        const red = play.card.suit === "H" || play.card.suit === "D";
                        return (
                            <div className="mindi-played-card" key={`${play.playerId}-${play.card.id}`}>
                                <div className={`mindi-card ${red ? "red" : ""} mindi-center-card`}>
                                    <span className="mindi-card-rank">{play.card.rank}</span>
                                    <span className="mindi-card-suit">{SUIT_SYMBOLS[play.card.suit]}</span>
                                </div>
                                <span>{play.seat}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="mindi-trick-empty">
                        <span className="trick-symbol">♠</span>
                        <span>Play a card to start the trick</span>
                    </div>
                )}
            </div>
        </section>
    );
}
