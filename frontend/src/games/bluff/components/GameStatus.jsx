import React from "react";

export default function GameStatus({ state, connected }) {
    const phase = state?.phase === "challenge" ? "Challenge window" : state?.phase === "final-challenge" ? "Final challenge" : "Play phase";
    return (
        <div className="bluff-statusbar">
            <div><span>PHASE</span><strong>{phase}</strong></div>
            <div><span>PILE</span><strong>{state?.pileCount ?? 0}</strong></div>
            <div><span>SOCKET</span><strong>{connected ? "LIVE" : "RECONNECTING"}</strong></div>
        </div>
    );
}
