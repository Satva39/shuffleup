export default function HandResult({ state }) {
    const result = state.handResult;
    if (!result || state.phase === "trick-play") return null;
    const made = result.contract?.made;
    return (
        <div className="twenty-nine-result-panel">
            <span className="twenty-nine-mini-label">Hand {result.handNumber} result</span>
            <h3>{result.contract?.team === "A" ? "Team A" : "Team B"} {made ? "made" : "failed"} the contract</h3>
            <p>{result.teamCardPoints?.[result.contract?.team] ?? 0} card points · {result.contract?.bid ?? 0} contract · {made ? "+1" : "−1"} game point</p>
        </div>
    );
}
