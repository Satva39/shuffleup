import React from "react";

export default function RoundResult({ result }) {
    if (!result) return null;

    return (
        <div className="sps-result-card">
            <div className="sps-result-kicker">ROUND COMPLETE</div>
            <h2>{result.roundWinnerUsername} wins the round</h2>
            <p>
                Scores carry forward. The game ends when any player reaches {result.targetScore} points.
            </p>
            <div className="sps-ranking">
                {result.ranking?.map((item) => (
                    <div className="sps-ranking-row" key={item.id}>
                        <span>#{item.rank}</span>
                        <strong>{item.username}</strong>
                        <span>
                            +{item.roundPenaltyPoints} this round · {item.totalPoints} total
                        </span>
                    </div>
                ))}
            </div>
            <div className="sps-result-next">Starting next round…</div>
        </div>
    );
}
