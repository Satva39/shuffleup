import UnoCard from "./UnoCard";

function PlayerSeat({ player, index, total, currentPlayerId, localPlayerId, onCallUno }) {
    const angle = -90 + (index * 360) / Math.max(total, 1);
    const isTurn = player.id === currentPlayerId;
    const isLocal = player.id === localPlayerId;
    const canCall = player.id !== localPlayerId && player.cardCount === 1 && !player.unoDeclared;

    const style = {
        "--seat-x": `${50 + 43 * Math.cos((angle * Math.PI) / 180)}%`,
        "--seat-y": `${48 + 34 * Math.sin((angle * Math.PI) / 180)}%`,
    };

    return (
        <div className={`uno-seat ${isLocal ? "uno-seat-local" : ""}`} style={style}>
            <div className={`uno-player-card ${isTurn ? "uno-player-turn" : ""} ${!player.connected ? "uno-player-offline" : ""}`}>
                <div className="uno-avatar">{player.username.charAt(0).toUpperCase()}</div>
                <div className="uno-player-copy">
                    <strong>{player.username}{isLocal ? " · YOU" : ""}</strong>
                    <span>{player.cardCount} cards · {player.score} pts</span>
                    {isTurn && <em>YOUR TURN</em>}
                    {!player.connected && <em>OFFLINE</em>}
                    {player.unoDeclared && player.cardCount === 1 && <em className="uno-badge">UNO</em>}
                </div>
                <div className="uno-opponent-stack">
                    {Array.from({ length: Math.min(player.cardCount, 3) }).map((_, cardIndex) => (
                        <UnoCard key={cardIndex} small faceDown />
                    ))}
                    <span>{player.cardCount}</span>
                </div>
                {canCall && onCallUno && (
                    <button className="uno-call-button" onClick={() => onCallUno(player.id)}>CALL UNO</button>
                )}
            </div>
        </div>
    );
}

export default PlayerSeat;
