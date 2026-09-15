import React from "react";

export default function GameResult({ state, localPlayerId }) {
    if (state?.status !== "complete") return null;
    const winner = state.players?.find((player) => player.id === state.winnerId);
    const mine = winner?.id === localPlayerId;
    return (
        <div className="bluff-game-over">
            <span className="eyebrow">GAME COMPLETE</span>
            <h1>{mine ? "YOU WIN" : `${winner?.username || "Player"} WINS`}</h1>
            <p>All cards were successfully cleared from the winning hand.</p>
        </div>
    );
}
