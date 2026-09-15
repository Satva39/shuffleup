function GameStatus({ connected, status, activeColor, notice, error }) {
    return (
        <header className="uno-status-bar">
            <div className="uno-connection">
                <span className={`uno-status-dot ${connected ? "" : "offline"}`} />
                <strong>{connected ? "LIVE TABLE" : "RECONNECTING..."}</strong>
            </div>
            <div className="uno-status-center">
                <span>UNO</span>
                <small>{status.replaceAll("-", " ").toUpperCase()}</small>
            </div>
            <div className="uno-active-color">
                <span>ACTIVE COLOR</span>
                <strong className={`uno-color-dot uno-bg-${activeColor || "wild"}`}>{activeColor || "WILD"}</strong>
            </div>
            {(notice || error) && <div className={`uno-notification ${error ? "error" : ""}`}>{error || notice}</div>}
        </header>
    );
}

export default GameStatus;
