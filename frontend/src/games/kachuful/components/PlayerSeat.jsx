function PlayerSeat({
    player,
    isCurrentTurn,
    isYou,
    compact = false,
}) {
    return (
        <article
            className={[
                "kachuful-seat",
                isCurrentTurn ? "seat-active" : "",
                isYou ? "seat-you" : "",
                !player.connected ? "seat-disconnected" : "",
                compact ? "seat-compact" : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="seat-avatar">
                {player.username?.charAt(0).toUpperCase() || "?"}
            </div>

            <div className="seat-main">
                <div className="seat-name-row">
                    <strong>{isYou ? "You" : player.username}</strong>
                    {isYou && <span className="seat-you-badge">YOU</span>}
                </div>

                <div className="seat-meta-row">
                    <span>Bid {player.bid ?? "—"}</span>
                    <span>Won {player.tricksWon ?? 0}</span>
                    <span>{player.score ?? 0} pts</span>
                </div>
            </div>

            <span
                className={`seat-connection-dot ${
                    player.connected ? "is-online" : "is-offline"
                }`}
                aria-label={player.connected ? "Connected" : "Disconnected"}
            />

            {isCurrentTurn && (
                <span className="seat-turn-mark">
                    {isYou ? "YOUR TURN" : "TURN"}
                </span>
            )}
        </article>
    );
}

export default PlayerSeat;
