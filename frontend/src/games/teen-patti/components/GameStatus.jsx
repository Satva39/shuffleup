function GameStatus({
    status,
    currentPlayer,
    error,
    connected,
    round,
    totalRounds,
}) {
    const statusText = {
        dealing: "DEALING CARDS",
        playing: currentPlayer
            ? `${currentPlayer.username}'S TURN`
            : "GAME IN PROGRESS",
        "round-complete": `ROUND ${round} COMPLETE`,
        complete: "GAME COMPLETE",
    };

    return (
        <div className="teen-game-status">
            <div className="teen-status-main">
                <span className="teen-status-dot" />

                <span className="teen-status-text">
                    {statusText[status] || "TEEN PATTI"}
                </span>

                {round && (
                    <span className="teen-status-round">
                        ROUND {round} / {totalRounds || 11}
                    </span>
                )}
            </div>

            <div className="teen-connection-status">
                {connected
                    ? "CONNECTED"
                    : "RECONNECTING..."}
            </div>

            {error && (
                <div className="teen-game-error">
                    {error}
                </div>
            )}
        </div>
    );
}

export default GameStatus;