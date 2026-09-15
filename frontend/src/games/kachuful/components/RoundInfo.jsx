function RoundInfo({ round, totalRounds, cardsPerPlayer }) {
    return (
        <div className="kachuful-info-block">
            <span className="kachuful-eyebrow">ROUND</span>
            <strong>{round} <small>/ {totalRounds}</small></strong>
            <span className="kachuful-info-note">{cardsPerPlayer} cards each</span>
        </div>
    );
}

export default RoundInfo;
