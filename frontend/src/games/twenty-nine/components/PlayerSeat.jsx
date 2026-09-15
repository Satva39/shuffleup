export default function PlayerSeat({ player, position, isCurrent, isSelf }) {
    if (!player) return <div className={`twenty-nine-seat ${position} is-empty`}>Waiting for player…</div>;
    return (
        <div className={`twenty-nine-seat ${position}${isCurrent ? " is-current" : ""}`}>
            <div className="twenty-nine-avatar">{player.username?.slice(0, 1)?.toUpperCase() || "?"}</div>
            <div className="twenty-nine-seat-copy">
                <strong>{player.username}{isSelf ? " · You" : ""}</strong>
                <span>{player.teamLabel} · {player.cardCount} cards</span>
                <span>{player.bid === "pass" ? "Passed" : player.bid == null ? "No bid" : `Bid ${player.bid}`} · Tricks {player.tricksWon}</span>
            </div>
        </div>
    );
}
