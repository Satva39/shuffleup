function PlayerSeat({ player, active, you, napoleon, partner }) {
    return (
        <div
            className={`napoleon-seat ${active ? "active" : ""
                } ${you ? "you" : ""}`}
        >
            <div className="seat-avatar">
                {player.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="seat-meta">
                <strong>
                    {player.username}
                    {you ? " · YOU" : ""}
                </strong>
                <span>
                    {!player.connected
                        ? "DISCONNECTED"
                        : napoleon
                            ? "NAPOLEON"
                            : partner
                                ? "ADJUTANT"
                                : `${player.cardCount} cards`}
                </span>
            </div>
            {active && <b className="seat-turn">TURN</b>}
        </div>
    );
}

export default PlayerSeat;
