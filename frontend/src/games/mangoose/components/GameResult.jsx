function GameResult({
    result,
    players,
    onLobby,
}) {
    if (!result) {
        return null;
    }

    return (
        <div className="mangoose-result-overlay">
            <section className="mangoose-result-card">
                <span className="mangoose-result-trophy">
                    🏆
                </span>

                <p>GAME COMPLETE</p>

                <h1>
                    {result.winnerUsername ||
                        "Winner"}
                </h1>

                <span className="mangoose-result-caption">
                    WINNER
                </span>

                <div className="mangoose-result-mongoose">
                    <span>MONGOOSE</span>
                    <strong>
                        {result.mongooseUsername ||
                            "—"}
                    </strong>
                </div>

                <div className="mangoose-final-list">
                    {result.finalStandings?.map(
                        (standing) => {
                            const player =
                                players.find(
                                    (item) =>
                                        item.id ===
                                        standing.id
                                );

                            return (
                                <div
                                    key={
                                        standing.id
                                    }
                                >
                                    <span>
                                        {player?.username ||
                                            standing.username}
                                    </span>
                                    <strong>
                                        {
                                            standing.cardsRemaining
                                        }
                                    </strong>
                                </div>
                            );
                        }
                    )}
                </div>

                <button
                    type="button"
                    onClick={onLobby}
                >
                    RETURN TO LOBBY
                </button>
            </section>
        </div>
    );
}

export default GameResult;
