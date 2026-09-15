import React from "react";

export default function KeyCardTracker({ tens }) {
    const a = tens?.A ?? 0;
    const b = tens?.B ?? 0;
    return (
        <div className="mindi-key-tracker">
            <span className="eyebrow">THE FOUR MINDIS</span>
            <div className="mindi-ten-row">
                <div className="mindi-ten-team"><b>TEAM A</b><span>{a}/4</span></div>
                <div className="mindi-ten-visual">10♠ 10♥ 10♦ 10♣</div>
                <div className="mindi-ten-team"><b>TEAM B</b><span>{b}/4</span></div>
            </div>
        </div>
    );
}
