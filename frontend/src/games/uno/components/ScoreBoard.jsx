function ScoreBoard({ players }) {
    return (
        <aside className="uno-scoreboard">
            <div className="uno-scoreboard-title">
                <span>SCOREBOARD</span>
                <small>FIRST TO 500</small>
            </div>
            <div className="uno-scoreboard-list">
                {[...(players || [])]
                    .sort((a, b) => b.score - a.score)
                    .map((player) => (
                        <div className="uno-score-row" key={player.id}>
                            <div>
                                <strong>{player.username}</strong>
                                <small>{player.cardCount} cards</small>
                            </div>
                            <b>{player.score}</b>
                        </div>
                    ))}
            </div>
        </aside>
    );
}

export default ScoreBoard;
