function PlayerSeat({ player, isCurrentTurn, isYou }) {
    return (
        <article
            className={[
                "kachuful-seat",
                isCurrentTurn ? "is-active" : "",
                isYou ? "is-you" : "",
                !player.connected ? "is-disconnected" : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="kachuful-seat-main">
                <div className="kachuful-seat-avatar">
                    {player.username?.charAt(0).toUpperCase()}
                    <span className="kachuful-seat-dot" />
                </div>

                <div className="kachuful-seat-info">
                    <div className="kachuful-seat-name-row">
                        <strong>{isYou ? "You" : player.username}</strong>
                        {isYou && <span className="you-badge">YOU</span>}
                    </div>

                    <div className="kachuful-seat-meta">
                        <span>{player.cardCount ?? 0} cards</span>
                        <span>•</span>
                        <span>{player.connected ? "Online" : "Offline"}</span>
                    </div>
                </div>
            </div>

            <div className="kachuful-seat-stats">
                <div>
                    <span>Bid</span>
                    <b>{player.bid ?? "—"}</b>
                </div>
                <div>
                    <span>Won</span>
                    <b>{player.tricksWon ?? 0}</b>
                </div>
                <div>
                    <span>Pts</span>
                    <b>{player.score ?? 0}</b>
                </div>
            </div>

            {isCurrentTurn && (
                <span className="kachuful-turn-badge">{isYou ? "YOUR TURN" : "TURN"}</span>
            )}
        </article>
    );
}

export default PlayerSeat;
