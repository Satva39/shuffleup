export default function GameStatus({ phase, error }) {
    const labels = { auction: "Auction in progress", "opening-lead": "Opening lead", "trick-play": "Playing tricks", "deal-complete": "Deal complete", "round-complete": "Deal complete" };
    return (
        <div className="bridge-status-row">
            <span className="bridge-status-dot" />
            <span>{labels[phase] || phase}</span>
            {error && <strong className="bridge-error-inline">{error}</strong>}
        </div>
    );
}
