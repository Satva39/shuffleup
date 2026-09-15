import CardStack from "./CardStack";

export default function PlayerSeat({ player, viewerId, active, position }) {
    const isYou = player.id === viewerId;
    return (
        <article className={`war-seat war-seat-${position} ${active ? "is-active" : ""} ${isYou ? "is-you" : ""} ${player.eliminated ? "is-eliminated" : ""}`}>
            <div className="war-seat-topline">
                <span className="war-seat-name">{isYou ? "YOU" : player.username}</span>
                {active && !player.eliminated && <span className="war-active-dot">LIVE</span>}
            </div>
            <CardStack count={player.cardCount} />
            <span className="war-seat-count">{player.eliminated ? "ELIMINATED" : `${player.cardCount} cards`}</span>
        </article>
    );
}
