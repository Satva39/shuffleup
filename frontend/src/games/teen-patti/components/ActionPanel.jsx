function ActionPanel({
    isMyTurn,
    legalActions = [],
    onAction,
    disabled,
}) {
    if (!isMyTurn) {
        return null;
    }

    const canPlay =
        legalActions.includes("play");

    const canFold =
        legalActions.includes("fold");

    return (
        <div className="teen-action-panel">
            <div className="teen-action-title">
                YOUR TURN
            </div>

            <div className="teen-action-buttons">
                {canPlay && (
                    <button
                        type="button"
                        className="teen-action-play"
                        onClick={() =>
                            onAction("play")
                        }
                        disabled={disabled}
                    >
                        PLAY
                    </button>
                )}

                {canFold && (
                    <button
                        type="button"
                        className="teen-action-fold"
                        onClick={() =>
                            onAction("fold")
                        }
                        disabled={disabled}
                    >
                        FOLD
                    </button>
                )}
            </div>
        </div>
    );
}

export default ActionPanel;