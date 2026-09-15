function GameStatus({
    connected,
    status,
    pendingMongoose,
    canCallMongoose,
    notice,
    error,
}) {
    const label =
        status === "complete"
            ? "GAME COMPLETE"
            : pendingMongoose
                ? canCallMongoose
                    ? "MONGOOSE CALL"
                    : "WAITING..."
                : connected
                    ? "LIVE"
                    : "RECONNECTING...";

    return (
        <div className="mangoose-game-status">
            <div>
                <span
                    className={`mangoose-status-dot ${connected
                            ? ""
                            : "mangoose-status-offline"
                        }`}
                />
                <strong>{label}</strong>
            </div>

            {pendingMongoose && canCallMongoose && (
                <span className="mangoose-call-banner">
                    {pendingMongoose.offenderUsername} may have missed a legal play
                </span>
            )}

            {notice && (
                <span className="mangoose-notice-banner">
                    {notice.message}
                </span>
            )}

            {error && (
                <span className="mangoose-game-error">
                    {error}
                </span>
            )}
        </div>
    );
}

export default GameStatus;
