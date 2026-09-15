export default function ActionPanel({ yourTurn, hasDrawn, selectedCardId, onDrawClosed, onDrawDiscard, onDiscard, onDeclare }) {
    return <div className="rummy-actions">
        <button type="button" disabled={!yourTurn || hasDrawn} onClick={onDrawClosed}>DRAW CLOSED</button>
        <button type="button" disabled={!yourTurn || hasDrawn} onClick={onDrawDiscard}>DRAW OPEN</button>
        <button type="button" disabled={!yourTurn || !hasDrawn || !selectedCardId} onClick={onDiscard}>DISCARD</button>
        <button type="button" className="primary" disabled={!yourTurn || !hasDrawn || !selectedCardId} onClick={onDeclare}>DECLARE</button>
    </div>;
}
