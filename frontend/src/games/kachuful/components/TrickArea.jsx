function getSuitSymbol(suit) {
    return { spades: "♠", diamonds: "♦", clubs: "♣", hearts: "♥" }[suit] || "";
}

function getPlayerName(players, playerId) {
    return players.find((player) => player.id === playerId)?.username || "Player";
}

function TrickArea({ trick = [], players = [], lastCompletedTrick = null, currentPlayerId }) {
    return (
        <section className="kachuful-trick-area" aria-label="Current trick">
            <div className="trick-header">
                <div>
                    <span className="trick-kicker">LIVE TRICK</span>
                    <strong>{trick.length ? `${trick.length} of ${players.length} cards played` : "Waiting for the first card"}</strong>
                </div>
                {lastCompletedTrick && !trick.length && (
                    <span className="trick-winner-chip">
                        Last: {getPlayerName(players, lastCompletedTrick.winnerId)}
                    </span>
                )}
            </div>

            <div className={`trick-cards trick-size-${trick.length}`}>
                {trick.length ? (
                    trick.map((play) => {
                        const card = play.card;
                        if (!card) return null;
                        const isRed = card.suit === "hearts" || card.suit === "diamonds";
                        const symbol = getSuitSymbol(card.suit);
                        const playerName = getPlayerName(players, play.playerId);
                        const isLatest = play.playerId === currentPlayerId;

                        return (
                            <div className={`trick-play ${isLatest ? "trick-play-latest" : ""}`} key={`${play.playerId}-${card.id}`}>
                                <span className="trick-player-name">{playerName}</span>
                                <div className={`trick-card-face ${isRed ? "trick-card-red" : ""}`}>
                                    <span className="trick-card-mini-rank">{card.rank}</span>
                                    <span className="trick-card-main-suit">{symbol}</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="trick-empty">
                        <span className="empty-card-outline">♠</span>
                        <span>Cards played this trick will land here</span>
                    </div>
                )}
            </div>
        </section>
    );
}

export default TrickArea;
