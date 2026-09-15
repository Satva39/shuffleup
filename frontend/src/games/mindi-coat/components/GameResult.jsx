import React from "react";

export default function GameResult({ winnerTeam, scores }) {
    if (!winnerTeam) return null;
    return (
        <div className="mindi-game-result">
            <span className="eyebrow">GAME COMPLETE</span>
            <h2>{winnerTeam === "A" ? "Team A" : "Team B"} wins Mindi Coat</h2>
            <p>{scores.A} – {scores.B}</p>
        </div>
    );
}
