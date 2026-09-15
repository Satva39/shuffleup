function GameResult({ players, onLobby, onPlayAgain }) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
        <main className="napoleon-result-page">
            <div className="result-card">
                <span className="result-kicker">GAME COMPLETE</span>
                <h1>{winner?.username || "Winner"} WINS</h1>
                <p>Final Napoleon leaderboard</p>

                <div className="final-scores">
                    {sorted.map((player, index) => (
                        <div className="final-score-row" key={player.id}>
                            <span>
                                <b>{index + 1}</b>
                                {player.username}
                            </span>
                            <strong>{player.score}</strong>
                        </div>
                    ))}
                </div>

                <div className="result-actions">
                    <button
                        className="primary-action"
                        type="button"
                        onClick={onPlayAgain}
                    >
                        PLAY AGAIN
                    </button>
                    <button
                        className="secondary-action"
                        type="button"
                        onClick={onLobby}
                    >
                        RETURN TO LOBBY
                    </button>
                </div>
            </div>
        </main>
    );
}

export default GameResult;
