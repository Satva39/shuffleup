import React from "react";

export default function GameResult({ winnerTeam, scores }) {
    if (!winnerTeam) return null;

    return (
        <section className="spades-result-card game-result">
            <span className="eyebrow">GAME COMPLETE</span>
            <div className="winner-mark">♠</div>
            <h2>{winnerTeam === "A" ? "Team A" : "Team B"} wins</h2>
            <p>Final score · {scores?.A || 0} – {scores?.B || 0}</p>
        </section>
    );
}
