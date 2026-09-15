function PlayerSeat({ player, active, local, target, onDraw }) {
    const canDraw = active && target && player.id === target.id;
    const initials = player.username?.slice(0, 1)?.toUpperCase() || "?";

    return (
        <div className={`jt-seat ${active ? "active" : ""} ${local ? "local" : ""} ${target ? "target" : ""}`}>
            <div className="jt-seat-card">
                <div className="jt-avatar">{initials}</div>
                <div className="jt-seat-copy">
                    <strong>{player.username}{local ? " · YOU" : ""}</strong>
                    <span>
                        {player.status === "loser" ? "JACK THIEF" :
                            player.status === "finished" ? `FINISHED #${player.eliminationPlace}` :
                                player.connected ? `${player.cardCount} cards` : "DISCONNECTED"}
                    </span>
                </div>
                <div className="jt-seat-dot" aria-label={player.connected ? "Connected" : "Disconnected"} />
            </div>
            {canDraw && (
                <button className="jt-target-chip" type="button" onClick={onDraw}>
                    DRAW FROM {player.username}
                </button>
            )}
        </div>
    );
}

export default PlayerSeat;
