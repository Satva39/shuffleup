function ActionPanel({
    legalActions,
    hasFlippedCard,
    legalTargets,
    connected,
    pendingMongoose,
    canCallMongoose,
    onFlip,
    onOpenPlay,
    onOwnDrop,
    onCallMongoose,
}) {
    const canFlip =
        connected &&
        !pendingMongoose &&
        !hasFlippedCard &&
        legalActions.includes("flip");

    const canOpenPlay =
        connected &&
        !pendingMongoose &&
        !hasFlippedCard &&
        legalActions.includes("play-open");

    const canSelfDrop =
        connected &&
        !pendingMongoose &&
        hasFlippedCard &&
        legalActions.includes("play-own");

    const hasDestination =
        Boolean(legalTargets?.center?.length) ||
        Boolean(legalTargets?.opponents?.length);

    const showCall =
        Boolean(pendingMongoose) &&
        canCallMongoose &&
        legalActions.includes(
            "call-mongoose"
        );

    return (
        <div className="mangoose-action-panel">
            <span className="mangoose-action-label">
                {pendingMongoose
                    ? showCall
                        ? `MONGOOSE CALL — ${pendingMongoose.offenderUsername}`
                        : "WAITING..."
                    : hasFlippedCard
                        ? hasDestination
                            ? "Choose where to play this card"
                            : "No legal destination — end your turn"
                        : "Choose a card to continue your turn"}
            </span>

            <div className="mangoose-action-buttons">
                {pendingMongoose ? (
                    showCall ? (
                        <button
                            type="button"
                            className="mangoose-call-button"
                            onClick={() =>
                                onCallMongoose(
                                    pendingMongoose.offenderId
                                )
                            }
                        >
                            MONGOOSE!
                        </button>
                    ) : (
                        <span className="mangoose-call-waiting">
                            WAITING FOR THE TABLE...
                        </span>
                    )
                ) : !hasFlippedCard ? (
                    <>
                        <button
                            type="button"
                            onClick={onFlip}
                            disabled={!canFlip}
                        >
                            TAKE FROM CLOSED
                        </button>

                        <button
                            type="button"
                            className="mangoose-action-secondary"
                            onClick={onOpenPlay}
                            disabled={!canOpenPlay}
                        >
                            TAKE FROM OPEN
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={onOwnDrop}
                        disabled={!canSelfDrop}
                    >
                        DROP / END TURN
                    </button>
                )}
            </div>
        </div>
    );
}

export default ActionPanel;
