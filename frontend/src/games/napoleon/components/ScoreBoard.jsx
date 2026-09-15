function ScoreBoard({ players }) {
    return (
        <aside className="score-board">
            <div className="panel-title">SCOREBOARD</div>
            {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                    <div className="score-row" key={player.id}>
                        <span>
                            <b>{index + 1}</b>
                            {player.username}
                        </span>
                        <em>
                            {player.roundScore > 0 ? "+" : ""}
                            {player.roundScore}
                        </em>
                        <strong>{player.score}</strong>
                    </div>
                ))}
        </aside>
    );
}

export default ScoreBoard;
