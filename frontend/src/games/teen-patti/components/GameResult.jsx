function GameResult({
    result,
    roundResult,
    currentRound,
    totalRounds,
    isRoundResult = false,
    canStartNextRound = false,
    isRoundWinner = false,
    onNextRound,
    onPlayAgain,
    onLobby,
}) {
    if (isRoundResult) {
        if (!roundResult) {
            return null;
        }

        return (
            <div className="teen-result-overlay">
                <div className="teen-result-card">
                    <div className="teen-result-trophy">
                        🏆
                    </div>

                    <span className="teen-result-label">
                        ROUND {currentRound} COMPLETE
                    </span>

                    <h1>
                        {roundResult.winnerUsername}
                    </h1>

                    <p className="teen-result-rounds">
                        ROUND WINNER
                    </p>

                    <div className="teen-result-score">
                        <span>
                            {isRoundWinner
                                ? "POINT EARNED"
                                : "YOUR RESULT"}
                        </span>

                        <strong>
                            {isRoundWinner ? "+1" : "NO POINT"}
                        </strong>
                    </div>

                    <div className="teen-result-score">
                        <span>PROGRESS</span>

                        <strong>
                            {currentRound} / {totalRounds}
                        </strong>
                    </div>

                    {canStartNextRound && (
                        <div className="teen-result-actions">
                            <button
                                type="button"
                                onClick={onNextRound}
                            >
                                NEXT ROUND
                            </button>

                            <button
                                type="button"
                                onClick={onLobby}
                            >
                                RETURN TO LOBBY
                            </button>
                        </div>
                    )}

                    {!canStartNextRound && (
                        <p className="teen-result-rounds">
                            WAITING FOR A PLAYER TO START THE NEXT ROUND
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    const scores = result.scores || [];

    return (
        <div className="teen-result-overlay">
            <div className="teen-result-card">
                <div className="teen-result-trophy">
                    🏆
                </div>

                <span className="teen-result-label">
                    OVERALL WINNER
                </span>

                <h1>
                    {result.winnerUsername}
                </h1>

                <p className="teen-result-rounds">
                    {result.totalRounds || 11} ROUNDS COMPLETED
                </p>

                <div className="teen-result-score">
                    <span>FINAL SCORE</span>

                    <strong>
                        {result.winnerScore ?? 0}
                    </strong>
                </div>

                <div className="teen-result-players">
                    {scores
                        .slice()
                        .sort(
                            (a, b) =>
                                (b.score || 0) -
                                (a.score || 0)
                        )
                        .map((player) => (
                            <div
                                className={`teen-result-player ${player.id === result.winnerId
                                        ? "is-winner"
                                        : ""
                                    }`}
                                key={player.id}
                            >
                                <span>
                                    {player.username}
                                </span>

                                <strong>
                                    {player.score || 0} POINT
                                    {(player.score || 0) !== 1
                                        ? "S"
                                        : ""}
                                </strong>
                            </div>
                        ))}
                </div>

                <div className="teen-result-actions">
                    <button
                        type="button"
                        onClick={onPlayAgain}
                    >
                        PLAY AGAIN
                    </button>

                    <button
                        type="button"
                        onClick={onLobby}
                    >
                        RETURN TO LOBBY
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameResult;