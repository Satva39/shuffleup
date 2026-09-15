import React from "react";

export default function ScoreBoard({ players = [] }) {
    return (
        <aside className="sps-scoreboard">
            <div className="sps-sidebar-heading"><span>SCOREBOARD</span><strong>Penalties</strong></div>
            <div className="sps-score-list">
                {[...players].sort((a, b) => (a.score || 0) - (b.score || 0)).map((player) => (
                    <div className="sps-score-row" key={player.id}>
                        <span>{player.username}</span>
                        <strong>{player.score || 0}</strong>
                    </div>
                ))}
            </div>
        </aside>
    );
}
