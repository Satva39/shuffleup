function GameStatus({ connected, status, notice, error }) {
    return (
        <header className="jt-status-bar">
            <div className="jt-brand">
                <small>SHUFFLEUP</small>
                <strong>JACK THIEF</strong>
            </div>
            <div className="jt-live-status">
                <span className={`jt-live-dot ${connected ? "" : "offline"}`} />
                <span>{connected ? "LIVE" : "RECONNECTING"}</span>
            </div>
            <div className={`jt-notice ${error ? "error" : ""}`}>
                {error || notice || (status === "complete" ? "THE JACK THIEF HAS BEEN FOUND" : "PLAYING LIVE")}
            </div>
        </header>
    );
}

export default GameStatus;
