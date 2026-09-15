function GameResult({ players, onPlayAgain, onLobby }) {
    const sortedPlayers = [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = sortedPlayers[0];

    return (
        <div className="kachuful-result-overlay">
            <div className="kachuful-result">
                <div className="result-hero-mark" aria-hidden="true">♛</div>
                <span className="result-label">KACHUFUL COMPLETE</span>
                <h1>{winner?.username || "Winner"} takes the table.</h1>
                <p className="result-lede">Final standings from the completed game.</p>

                <div className="final-scores">
                    {sortedPlayers.map((player, index) => (
                        <div className={`final-score-row ${index === 0 ? "final-winner" : ""}`} key={player.id}>
                            <span className="rank-badge">{index + 1}</span>
                            <div className="result-player-copy">
                                <strong>{player.username}</strong>
                                <small>{player.tricksWon ?? 0} tricks · {player.bid ?? "—"} bid</small>
                            </div>
                            <b>{player.score ?? 0}</b>
                        </div>
                    ))}
                </div>

                <div className="result-actions">
                    <button className="primary-action" type="button" onClick={onPlayAgain}>
                        <span>Play again</span>
                        <span aria-hidden="true">↻</span>
                    </button>
                    <button className="secondary-action" type="button" onClick={onLobby}>Return to lobby</button>
                </div>
            </div>
        </div>
    );
}

export default GameResult;
