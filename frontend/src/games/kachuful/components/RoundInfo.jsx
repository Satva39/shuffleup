function RoundInfo({ round, totalRounds, cardsPerPlayer }) {
    return (
        <div className="kachuful-round-info context-card">
            <div className="round-number">
                <span>{String(round).padStart(2, "0")}</span>
                <small>/{String(totalRounds).padStart(2, "0")}</small>
            </div>
            <div className="context-copy">
                <span>ROUND</span>
                <strong>{cardsPerPlayer} {cardsPerPlayer === 1 ? "card" : "cards"} each</strong>
                <small>Progressive deal</small>
            </div>
        </div>
    );
}

export default RoundInfo;
