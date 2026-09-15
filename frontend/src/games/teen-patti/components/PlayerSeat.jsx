import PlayingCard from "./PlayingCard";

function PlayerSeat({
    player,
    isLocal,
    isTurn,
}) {
    if (!player) {
        return null;
    }

    const isFolded =
        player.status === "folded";

    const isDisconnected =
        !player.connected ||
        player.status === "disconnected";

    const isWinner =
        player.status === "winner";

    return (
        <div
            className={[
                "teen-player-seat",
                isLocal
                    ? "teen-player-seat-local"
                    : "",
                isTurn
                    ? "teen-player-seat-turn"
                    : "",
                isFolded
                    ? "teen-player-seat-folded"
                    : "",
                isWinner
                    ? "teen-player-seat-winner"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="teen-player-avatar">
                {player.username
                    ?.charAt(0)
                    .toUpperCase() || "?"}
            </div>

            <div className="teen-player-info">
                <strong>
                    {isLocal
                        ? "YOU"
                        : player.username}
                </strong>

                <span>
                    {isWinner
                        ? "WINNER"
                        : isFolded
                            ? "FOLDED"
                            : isDisconnected
                                ? "DISCONNECTED"
                                : isTurn
                                    ? "YOUR TURN"
                                    : "IN GAME"}
                </span>
            </div>

            {!isLocal &&
                !isFolded &&
                player.cardCount > 0 && (
                    <div className="teen-opponent-cards">
                        {Array.from({
                            length: Math.min(
                                player.cardCount,
                                3
                            ),
                        }).map((_, index) => (
                            <PlayingCard
                                key={index}
                                hidden
                                small
                            />
                        ))}
                    </div>
                )}
        </div>
    );
}

export default PlayerSeat;