function getSuitSymbol(suit) {
    const symbols = {
        spades: "♠",
        diamonds: "♦",
        clubs: "♣",
        hearts: "♥",
    };

    return symbols[suit] || "";
}

function TrickArea({ trick = [], players = [], lastCompletedTrick = null }) {
    const getPlayerName = (playerId) =>
        players.find((player) => player.id === playerId)?.username || "Player";

    return (
        <section className="kachuful-trick-area">
            {trick.length > 0 ? (
                <>
                    <div className="trick-cards">
                        {trick.map((play) => {
                            const card = play.card;
                            if (!card) return null;

                            const isRed =
                                card.suit === "hearts" || card.suit === "diamonds";

                            return (
                                <div
                                    className="trick-card"
                                    key={`${play.playerId}-${card.id}`}
                                >
                                    <span className="trick-player">
                                        {getPlayerName(play.playerId)}
                                    </span>
                                    <div className={`trick-card-face ${isRed ? "is-red" : ""}`}>
                                        <b>{card.rank}</b>
                                        <span>{getSuitSymbol(card.suit)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <span className="trick-count">
                        {trick.length} card{trick.length === 1 ? "" : "s"} in trick
                    </span>
                </>
            ) : lastCompletedTrick ? (
                <div className="trick-complete-state">
                    <span>LAST TRICK</span>
                    <strong>
                        {getPlayerName(lastCompletedTrick.winnerId)} won the trick
                    </strong>
                </div>
            ) : (
                <div className="trick-empty-state">
                    <span className="trick-empty-symbol">♣</span>
                    <strong>Ready for the first card</strong>
                    <small>The trick appears here as cards are played.</small>
                </div>
            )}
        </section>
    );
}

export default TrickArea;
