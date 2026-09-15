function getSuitSymbol(suit) {
    const symbols = {
        spades: "♠",
        diamonds: "♦",
        clubs: "♣",
        hearts: "♥",
    };

    return symbols[suit] || "";
}

function TrickArea({
    trick = [],
    players = [],
    lastCompletedTrick = null,
}) {
    const getPlayerName = (playerId) =>
        players.find((player) => player.id === playerId)?.username || "Player";

    return (
        <section className="kachuful-trick-area" aria-label="Current trick">
            <div className="trick-heading">
                <span>TABLE</span>
                <strong>Current trick</strong>
            </div>

            <div className="trick-cards">
                {trick.map((play) => {
                    const card = play.card;
                    if (!card) return null;

                    const isRed =
                        card.suit === "hearts" || card.suit === "diamonds";

                    return (
                        <div
                            className="trick-play"
                            key={`${play.playerId}-${card.id}`}
                        >
                            <span className="trick-player-name">
                                {getPlayerName(play.playerId)}
                            </span>
                            <div
                                className={`trick-card-face ${
                                    isRed ? "trick-card-red" : ""
                                }`}
                            >
                                <span>{card.rank}</span>
                                <strong>{getSuitSymbol(card.suit)}</strong>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!trick.length && lastCompletedTrick ? (
                <div className="trick-result">
                    Previous trick won by{" "}
                    <strong>
                        {getPlayerName(lastCompletedTrick.winnerId)}
                    </strong>
                </div>
            ) : null}

            {!trick.length && !lastCompletedTrick ? (
                <div className="trick-empty">
                    <span>No cards played yet</span>
                    <small>The played cards will appear here.</small>
                </div>
            ) : null}
        </section>
    );
}

export default TrickArea;
