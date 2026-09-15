export default function TrumpDisplay({ state }) {
    const trump = state.trump;
    const known = state.knownTrump;
    return (
        <div className="twenty-nine-trump-card">
            <span className="twenty-nine-mini-label">Trump</span>
            {trump ? (
                <strong>{trump.symbol} {trump.label}</strong>
            ) : state.phase === "trump-selection" ? (
                <strong className="is-warm">Choose a suit</strong>
            ) : known ? (
                <strong>{known.symbol} {known.label} <small>(hidden)</small></strong>
            ) : (
                <strong className="is-muted">Hidden</strong>
            )}
        </div>
    );
}
