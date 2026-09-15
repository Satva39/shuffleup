function ScoreBoard({ players, userId }) {
    const leaderId = players.length
        ? players.reduce(
              (leader, player) =>
                  player.score > (leader?.score ?? -Infinity) ? player : leader,
              null
          )?.id
        : null;

    return (
        <section className="kachuful-score-strip" aria-label="Scoreboard">
            <div className="kachuful-score-strip-head">
                <div>
                    <span className="kachuful-eyebrow">SCOREBOARD</span>
                    <strong>{players.length} players</strong>
                </div>
                <span className="score-live-chip">
                    <i />
                    LIVE
                </span>
            </div>

            <div className="kachuful-score-list">
                {players.map((player) => (
                    <div
                        className={[
                            "kachuful-score-item",
                            player.id === userId ? "is-you" : "",
                            player.id === leaderId ? "is-leader" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        key={player.id}
                    >
                        <span className="score-avatar">
                            {player.username?.charAt(0).toUpperCase()}
                        </span>

                        <div className="score-player">
                            <strong>{player.id === userId ? "You" : player.username}</strong>
                            <span>{player.tricksWon ?? 0} tricks</span>
                        </div>

                        <div className="score-bid">
                            <span>Bid</span>
                            <b>{player.bid ?? "—"}</b>
                        </div>

                        <div className="score-points">
                            <span>PTS</span>
                            <b>{player.score ?? 0}</b>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ScoreBoard;
