function ScoreBoard({
    players,
}) {
    return (
        <aside className="mangoose-scoreboard">
            <div className="mangoose-panel-heading">
                TABLE
            </div>

            <div className="mangoose-score-list">
                {[...players]
                    .sort(
                        (a, b) =>
                            a.closedCount +
                            a.openCount -
                            (b.closedCount +
                                b.openCount)
                    )
                    .map((player) => (
                        <div
                            key={player.id}
                            className="mangoose-score-row"
                        >
                            <span>
                                <strong>
                                    {player.username}
                                </strong>
                                <small>
                                    {player.status.toUpperCase()}
                                </small>
                            </span>
                            <strong>
                                {player.closedCount +
                                    player.openCount}
                            </strong>
                        </div>
                    ))}
            </div>
        </aside>
    );
}

export default ScoreBoard;
