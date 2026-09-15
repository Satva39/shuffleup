function ActionPanel({ isMyTurn, target, connected }) {
    return (
        <aside className="jt-action-panel">
            <div className="jt-turn-kicker">{connected ? "LIVE TABLE" : "RECONNECTING"}</div>
            <h2>{isMyTurn ? "YOUR TURN" : target ? `WAITING FOR ${target.username.toUpperCase()}` : "TABLE UPDATING"}</h2>
            <p>{isMyTurn ? `Select one hidden card from ${target?.username || "the next player"}.` : "The server controls turn order and card ownership."}</p>
            {isMyTurn && target && (
                <div className="jt-action-hint">Choose any face-down card on {target.username}&apos;s hand.</div>
            )}
        </aside>
    );
}

export default ActionPanel;
