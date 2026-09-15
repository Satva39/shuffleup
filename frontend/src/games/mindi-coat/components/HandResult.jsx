import React from "react";

export default function HandResult({ result }) {
    if (!result || result.coat) return null;
    return (
        <div className="mindi-result-card">
            <div><span className="eyebrow">HAND RESULT</span><h3>{result.winningTeamName || "No winner"}</h3></div>
            <div className="mindi-result-stats"><span>{result.tens.A}–{result.tens.B} tens</span><span>{result.tricks.A}–{result.tricks.B} tricks</span><b>+{result.score}</b></div>
        </div>
    );
}
