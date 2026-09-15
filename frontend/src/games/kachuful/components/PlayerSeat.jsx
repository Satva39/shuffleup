function PlayerSeat({ player, isCurrentTurn, isYou }) {
    return (
        <article
            className={[
                "kachuful-seat",
                isCurrentTurn ? "seat-active" : "",
                isYou ? "seat-you" : "",
                !player.connected ? "seat-disconnected" : "",
            ].filter(Boolean).join(" ")}
        >
            <div className="seat-avatar-wrap">
                <div className="seat-avatar">
                    {player.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <span className={`seat-presence ${player.connected ? "online" : "offline"}`} />
            </div>

            <div className="seat-details">
                <div className="seat-name-line">
                    <strong title={player.username}>{isYou ? "YOU" : player.username}</strong>
                    {isYou && <span className="you-chip">YOU</span>}
                </div>
                <div className="seat-meta">
                    <span>Bid <b>{player.bid ?? "—"}</b></span>
                    <span>Won <b>{player.tricksWon ?? 0}</b></span>
                </div>
            </div>

            <div className="seat-score-block">
                <span>SCORE</span>
                <strong>{player.score ?? 0}</strong>
            </div>

            {isCurrentTurn && (
                <div className="seat-turn-glow">
                    <span>{isYou ? "YOUR TURN" : "TURN"}</span>
                </div>
            )}
        </article>
    );
}

export default PlayerSeat;
