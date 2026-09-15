function GameResult({ players, onPlayAgain, onLobby }) {
    const sortedPlayers = [...players].sort(
        (a, b) => b.score - a.score
    );

    const winner = players.reduce(
        (best, player) =>
            !best || player.score > best.score
                ? player
                : best,
        null
    );

    return (
        <div className="kachuful-result-overlay">
            <div className="kachuful-result">
                <span className="result-label">
                    GAME COMPLETE
                </span>

                <h1>
                    🏆 {winner?.username} WINS
                </h1>

                <div className="final-scores">
                    {sortedPlayers.map(
                        (player, index) => (
                            <div
                                className="final-score-row"
                                key={player.id}
                            >
                                <span>
                                    {index + 1}.
                                </span>

                                <strong>
                                    {player.username}
                                </strong>

                                <b>
                                    {player.score}
                                </b>
                            </div>
                        )
                    )}
                </div>

                <div className="result-actions">
                    <button
                        type="button"
                        onClick={onPlayAgain}
                    >
                        Play Again
                    </button>

                    <button
                        type="button"
                        onClick={onLobby}
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameResult;