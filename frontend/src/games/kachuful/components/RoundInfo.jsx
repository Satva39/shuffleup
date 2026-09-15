function RoundInfo({
    round,
    totalRounds,
    cardsPerPlayer,
}) {
    return (
        <div className="kachuful-round-info">
            <span>ROUND</span>

            <strong>
                {round} / {totalRounds}
            </strong>

            <small>
                {cardsPerPlayer}{" "}
                {cardsPerPlayer === 1
                    ? "card"
                    : "cards"}{" "}
                per player
            </small>
        </div>
    );
}

export default RoundInfo;