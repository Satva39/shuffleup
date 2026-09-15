function ScoreBoard({ players }) {
    return (
        <aside className="kachuful-scoreboard">
            <div className="scoreboard-heading">
                <div>
                    <span>SCOREBOARD</span>
                    <strong>{players.length} players</strong>
                </div>
                <span className="scoreboard-live">LIVE</span>
            </div>

            <div className="scoreboard-list">
                {players.map((player) => (
                    <div
                        className="score-row"
                        key={player.id}
                    >
                        <div className="score-player">
                            <span className="score-avatar">
                                {player.username?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <strong>{player.username}</strong>
                        </div>

                        <span>{player.bid ?? "—"}</span>
                        <span>{player.tricksWon ?? 0}</span>
                        <b>{player.score ?? 0}</b>
                    </div>
                ))}
            </div>
        </aside>
    );
}

export default ScoreBoard;
