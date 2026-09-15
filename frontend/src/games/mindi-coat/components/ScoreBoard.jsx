import React from "react";

export default function ScoreBoard({ scores, targetScore, tens }) {
    return (
        <section className="mindi-scoreboard">
            <div className="mindi-score-team">
                <span>TEAM A</span>
                <strong>{scores.A}</strong>
                <small>{tens?.A ?? 0} tens this hand · target {targetScore}</small>
            </div>
            <div className="mindi-score-center">
                <span>MINDI COAT</span>
                <strong>♠ ♥ ♦ ♣</strong>
            </div>
            <div className="mindi-score-team team-b">
                <span>TEAM B</span>
                <strong>{scores.B}</strong>
                <small>{tens?.B ?? 0} tens this hand · target {targetScore}</small>
            </div>
        </section>
    );
}
