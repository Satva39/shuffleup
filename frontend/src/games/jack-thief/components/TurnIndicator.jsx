function TurnIndicator({ state, localPlayerId }) {
    const current = state?.players?.find((player) => player.id === state.currentPlayerId);
    const target = state?.players?.find((player) => player.id === state.targetPlayerId);
    const mine = state?.currentPlayerId === localPlayerId;

    return (
        <div className="jt-turn-indicator">
            <span>{mine ? "YOUR TURN" : current ? `${current.username}'S TURN` : "ROUND COMPLETE"}</span>
            {target && state?.status === "playing" && <small>DRAW FROM {target.username}</small>}
        </div>
    );
}

export default TurnIndicator;
