function ScoreBoard({ players }) {
    return (
        <aside className="kachuful-scoreboard">
            <header>
                <span>PLAYER</span>
                <span>BID</span>
                <span>WON</span>
                <span>ROUND</span>
                <span>TOTAL</span>
            </header>

            {players.map((player) => (
                <div
                    className="score-row"
                    key={player.id}
                >
                    <strong>
                        {player.username}
                    </strong>

                    <span>
                        {player.bid ?? "—"}
                    </span>

                    <span>
                        {player.tricksWon}
                    </span>

                    <span>
                        {player.roundScore}
                    </span>

                    <strong>
                        {player.score}
                    </strong>
                </div>
            ))}
        </aside>
    );
}

export default ScoreBoard;