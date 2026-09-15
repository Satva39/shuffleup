import React from "react";

export default function TeamScore({ team, score = 0, bags = 0, players = [] }) {
    const label = team === "A" ? "Team A" : "Team B";
    return (
        <div className={`team-score team-${team.toLowerCase()}`}>
            <div className="team-score-topline">
                <span>{label}</span>
                <small>{players.join(" · ")}</small>
            </div>
            <div className="team-score-value">{score}</div>
            <div className="team-score-meta">
                <span>{bags} bags</span>
                <span>to 500</span>
            </div>
        </div>
    );
}
