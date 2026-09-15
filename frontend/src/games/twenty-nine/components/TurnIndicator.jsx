export default function TurnIndicator({ state }) {
    const player = state.players?.find((item) => item.id === state.currentPlayerId);
    return (
        <div className={`twenty-nine-turn ${state.isMyTurn ? "is-mine" : ""}`}>
            {state.isMyTurn ? "Your turn" : `${player?.username || "Player"}'s turn`}
        </div>
    );
}
