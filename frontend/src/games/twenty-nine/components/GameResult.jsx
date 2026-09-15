export default function GameResult({ state, onNextHand }) {
    if (state.phase !== "hand-complete" && state.phase !== "game-complete") return null;
    const complete = state.phase === "game-complete";
    return (
        <div className="twenty-nine-overlay">
            <div className="twenty-nine-result-modal">
                <span className="twenty-nine-kicker">{complete ? "Game complete" : "Hand complete"}</span>
                <h2>{complete ? `Team ${state.winnerTeam} wins` : "Deal complete"}</h2>
                <p>Team A {state.scores?.A ?? 0} · Team B {state.scores?.B ?? 0}</p>
                {!complete && <button type="button" onClick={onNextHand} disabled={!state.isDealer}>Start next hand</button>}
                {complete && <small>Return to the room to begin another game.</small>}
            </div>
        </div>
    );
}
