import React from "react";
import TurnIndicator from "./TurnIndicator";

export default function GameStatus({ state, userId, connected }) {
    return (
        <header className="sps-game-status">
            <div>
                <span className="sps-eyebrow">SHUFFLEUP · CLASSIC</span>
                <h1>Satte Pe Satta</h1>
            </div>
            <div className="sps-status-right">
                <span className={`sps-connection ${connected ? "online" : "offline"}`}>{connected ? "Connected" : "Reconnecting"}</span>
                <TurnIndicator state={state} userId={userId} />
            </div>
        </header>
    );
}
