import React from "react";

export default function TurnIndicator({ state, localPlayerId }) {
    const mine = state?.currentPlayerId === localPlayerId && state?.phase === "play";
    const current = state?.players?.find((player) => player.id === state?.currentPlayerId);
    return (
        <div className={`bluff-turn ${mine ? "mine" : ""}`}>
            <span>{mine ? "YOUR TURN" : `${current?.username || "Player"}'s turn`}</span>
            <strong>{state?.requiredRank}</strong>
        </div>
    );
}
