function ScoreBoard({ players, userId }) {
    return (
        <details className="kachuful-scoreboard context-card">
            <summary>
                <span className="score-summary-icon">Σ</span>
                <span>
                    <b>Scoreboard</b>
                    <small>{players.length} players</small>
                </span>
                <span className="score-summary-chevron">⌄</span>
            </summary>
            <div className="scoreboard-popover">
                <header className="scoreboard-head">
                    <span>PLAYER</span>
                    <span>BID</span>
                    <span>WON</span>
                    <span>PTS</span>
                </header>
                {players.map((player) => (
                    <div className={`score-row ${player.id === userId ? "score-self" : ""}`} key={player.id}>
                        <div className="score-player">
                            <span className="score-avatar">{player.username?.charAt(0)?.toUpperCase() || "?"}</span>
                            <strong>{player.id === userId ? "You" : player.username}</strong>
                        </div>
                        <span>{player.bid ?? "—"}</span>
                        <span>{player.tricksWon ?? 0}</span>
                        <strong>{player.score ?? 0}</strong>
                    </div>
                ))}
            </div>
        </details>
    );
}

export default ScoreBoard;
