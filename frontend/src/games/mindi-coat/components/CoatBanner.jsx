import React from "react";

export default function CoatBanner({ result }) {
    if (!result?.coat) return null;
    return (
        <div className="mindi-coat-banner">
            <span className="eyebrow">SPECIAL HAND</span>
            <h2>COAT</h2>
            <p>{result.winningTeamName || `Team ${result.winnerTeam}`} captured all four Mindis.</p>
        </div>
    );
}
