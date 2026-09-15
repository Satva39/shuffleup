import React from "react";

export default function TurnIndicator({ state, userId }) {
    const mine = state?.currentPlayerId === userId && state?.status === "playing";
    const name = state?.players?.find((player) => player.id === state?.currentPlayerId)?.username || "—";
    return <div className={`sps-turn-indicator ${mine ? "sps-turn-indicator--mine" : ""}`}>{mine ? "YOUR TURN" : `${name}'s TURN`}</div>;
}
