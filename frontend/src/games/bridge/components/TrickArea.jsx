import PlayingCard from "./PlayingCard";

export default function TrickArea({ trick = [], winnerSeat }) {
    return (
        <div className="bridge-trick-area">
            <div className="bridge-trick-title">Current trick · {trick.length}/4</div>
            <div className="bridge-trick-cards">
                {trick.map((entry) => (
                    <div key={`${entry.playerId}-${entry.card.id}`} className={`bridge-played-card bridge-played-${entry.seat.toLowerCase()} ${winnerSeat === entry.seat ? "is-winner" : ""}`}>
                        <PlayingCard card={entry.card} />
                        <small>{entry.seat}</small>
                    </div>
                ))}
                {trick.length === 0 && <div className="bridge-trick-placeholder">Lead a card to begin the trick.</div>}
            </div>
        </div>
    );
}
