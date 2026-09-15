function GameResult({ players, onPlayAgain, onLobby }) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
        <div className="kachuful-result-overlay">
            <div className="kachuful-result">
                <div className="kachuful-result-mark">SU</div>
                <span className="result-label">KACHUFUL COMPLETE</span>
                <h1>{winner?.username} wins</h1>
                <p>Final standings from the completed server game.</p>

                <div className="final-scores">
                    {sortedPlayers.map((player, index) => (
                        <div className="final-score-row" key={player.id}>
                            <span className={`rank-badge ${index === 0 ? "winner" : ""}`}>
                                {index + 1}
                            </span>
                            <div>
                                <strong>{player.username}</strong>
                                <small>{player.tricksWon ?? 0} tricks won</small>
                            </div>
                            <b>{player.score}</b>
                        </div>
                    ))}
                </div>

                <div className="result-actions">
                    <button type="button" className="secondary-button" onClick={onLobby}>
                        Return to Lobby
                    </button>
                    <button type="button" className="primary-button" onClick={onPlayAgain}>
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameResult;
