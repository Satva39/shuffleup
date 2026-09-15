import React from "react";

export default function HandResult({ result }) {
    if (!result) return null;

    return (
        <section className="spades-result-card">
            <div className="result-title-row">
                <div>
                    <span className="eyebrow">HAND COMPLETE</span>
                    <h3>Hand {result.handNumber}</h3>
                </div>
                <span className="result-badge">Score updated</span>
            </div>

            <div className="hand-result-grid">
                {Object.entries(result.teams || {}).map(([team, data]) => (
                    <div className="hand-result-team" key={team}>
                        <div>
                            <span>{team === "A" ? "Team A" : "Team B"}</span>
                            <strong>{data.total >= 0 ? "+" : ""}{data.total}</strong>
                        </div>
                        <small>
                            Bid {data.bidTotal} · Tricks {data.tricksTaken}
                        </small>
                    </div>
                ))}
            </div>
        </section>
    );
}
