function PlayerSeat({
    player,
    isCurrentTurn,
    isYou,
}) {
    return (
        <div
            className={[
                "kachuful-seat",
                isCurrentTurn
                    ? "seat-active"
                    : "",
                isYou
                    ? "seat-you"
                    : "",
                !player.connected
                    ? "seat-disconnected"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="seat-avatar">
                {player.username
                    ?.charAt(0)
                    .toUpperCase()}
            </div>

            <div className="seat-details">
                <strong>
                    {isYou
                        ? "YOU"
                        : player.username}
                </strong>

                <span>
                    {player.cardCount} cards
                </span>

                {player.bid !== null && (
                    <span>
                        Bid {player.bid}
                    </span>
                )}

                <span>
                    Won {player.tricksWon}
                </span>
            </div>

            {!player.connected && (
                <span className="seat-status">
                    Disconnected
                </span>
            )}
        </div>
    );
}

export default PlayerSeat;