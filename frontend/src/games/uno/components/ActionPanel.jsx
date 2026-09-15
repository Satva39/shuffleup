function ActionPanel({ isMyTurn, canDraw, canUno, canCallUno, hasPendingColor, connected, selectedCard, onPlay, onDraw, onUno, onCallUno }) {
    return (
        <div className="uno-action-panel">
            <button className="uno-primary-action" disabled={!isMyTurn || !selectedCard || hasPendingColor || !connected} onClick={onPlay}>
                PLAY CARD
            </button>
            <button className="uno-secondary-action" disabled={!canDraw || !connected} onClick={onDraw}>
                DRAW
            </button>
            <button className="uno-uno-action" disabled={!canUno || !connected} onClick={onUno}>
                UNO!
            </button>
            {canCallUno && (
                <button className="uno-call-panel-action" disabled={!connected} onClick={onCallUno}>
                    CALL UNO
                </button>
            )}
        </div>
    );
}

export default ActionPanel;
