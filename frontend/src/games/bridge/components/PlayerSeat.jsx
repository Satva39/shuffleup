import PlayerHand from "./PlayerHand";
import { PARTNER_LABELS, SEAT_LABELS } from "../logic/gameState";

export default function PlayerSeat({ player, viewerId, position, selectableIds, onCardClick, dummyRevealed, isCurrent }) {
    if (!player) return null;
    const showCards = player.hand?.length > 0 || (dummyRevealed && position === player.seat);
    return (
        <div className={`bridge-seat bridge-seat-${position.toLowerCase()} ${isCurrent ? "is-current" : ""} ${player.connected ? "" : "is-disconnected"}`}>
            <div className="bridge-seat-header">
                <span className="bridge-seat-name">
                    {SEAT_LABELS[player.seat]} · {player.username}
                    {player.id === viewerId ? " (You)" : ""}
                </span>
                <span className="bridge-seat-meta">{PARTNER_LABELS[player.partnership]} · {player.tricksWon} tricks</span>
            </div>
            {showCards ? (
                <PlayerHand cards={player.hand || []} selectableIds={selectableIds} onCardClick={onCardClick} compact={player.seat !== "S"} />
            ) : (
                <div className="bridge-hidden-hand">{player.cardCount} cards hidden</div>
            )}
        </div>
    );
}
