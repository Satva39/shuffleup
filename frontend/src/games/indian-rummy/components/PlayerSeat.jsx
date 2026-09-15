export default function PlayerSeat({ player, isYou, isTurn }) {
    return (
        <div className={`rummy-seat ${isYou ? "you" : ""} ${isTurn ? "turn" : ""}`}>
            <div className="rummy-avatar">{player.username.charAt(0).toUpperCase()}</div>
            <div className="rummy-seat-copy">
                <strong>{isYou ? "YOU · " : ""}{player.username}</strong>
                <span>{player.cardCount} cards · {player.status}</span>
            </div>
            {isTurn && <b className="turn-pill">TURN</b>}
        </div>
    );
}
