export default function GameStatus({ state, error }) {
    const phaseLabel = {
        bidding: "Auction",
        "trump-selection": "Trump selection",
        "trick-play": "Trick play",
        "hand-complete": "Hand complete",
        "game-complete": "Game complete",
    }[state.phase] || state.phase;
    return (
        <div className="twenty-nine-status-row">
            <span>{phaseLabel}</span>
            {error ? <span className="is-error">{error}</span> : <span>Hand {state.handNumber}</span>}
        </div>
    );
}
