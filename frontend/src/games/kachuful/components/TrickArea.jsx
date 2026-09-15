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
        players.find(
            (player) => player.id === playerId
        )?.username || "Player";

    return (
        <section className="kachuful-trick-area">
            <div className="trick-title">
                CURRENT TRICK
            </div>

            <div className="trick-cards">
                {trick.map((play) => {
                    const card = play.card;

                    if (!card) return null;

                    const isRed =
                        card.suit === "hearts" ||
                        card.suit === "diamonds";

                    return (
                        <div
                            className="trick-card"
                            key={`${play.playerId}-${card.id}`}
                        >
                            <div className="trick-player">
                                {getPlayerName(
                                    play.playerId
                                )}
                            </div>

                            <div
                                className={`trick-card-face ${isRed
                                        ? "trick-card-red"
                                        : ""
                                    }`}
                            >
                                <span className="trick-card-rank">
                                    {card.rank}
                                </span>

                                <span className="trick-card-suit">
                                    {getSuitSymbol(
                                        card.suit
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!trick.length &&
                lastCompletedTrick && (
                    <div className="trick-result">
                        Trick won by{" "}
                        <strong>
                            {getPlayerName(
                                lastCompletedTrick.winnerId
                            )}
                        </strong>
                    </div>
                )}
        </section>
    );
}

export default TrickArea;