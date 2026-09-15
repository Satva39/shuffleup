function formatTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(value / 60);
    const remainder = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function PlayerProgress({ player }) {
    return (
        <div className="opponent-card">
            <div className="opponent-topline">
                <div className="opponent-name">
                    <span className="player-dot" />
                    <strong>{player.username}</strong>
                </div>

                <span className={`opponent-status ${player.status.toLowerCase()}`}>
                    {player.status}
                </span>
            </div>

            <div className="progress-bar">
                <span style={{ width: `${(player.progress / 52) * 100}%` }} />
            </div>

            <div className="opponent-meta">
                <span>{player.progress}/52</span>
                <span>{player.score} pts</span>
                {player.completionTime != null && (
                    <span>{formatTime(player.completionTime)}</span>
                )}
            </div>
        </div>
    );
}
