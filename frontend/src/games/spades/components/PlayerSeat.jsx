import React from "react";
import { bidLabel } from "../logic/bidding";
import { SEAT_LABELS } from "../logic/gameState";
import PlayerHand from "./PlayerHand";

export default function PlayerSeat({ player, viewer, hand, legalCardIds, onPlayCard, currentTurn }) {
    if (!player) return null;

    const isViewer = player.id === viewer?.id;
    const teamName = player.team === "A" ? "Team A" : "Team B";
    const seatName = SEAT_LABELS[player.seat] || player.seat;

    return (
        <section className={`spades-seat ${isViewer ? "is-you" : ""} ${currentTurn ? "is-active" : ""}`}>
            <header className="seat-header">
                <div className="seat-identity">
                    <div className="seat-avatar">{isViewer ? "YOU" : player.username?.charAt(0)?.toUpperCase()}</div>
                    <div>
                        <strong>{isViewer ? "You" : player.username}</strong>
                        <span>{seatName} · {teamName}</span>
                    </div>
                </div>
                <div className="seat-stats">
                    <span>Bid <b>{bidLabel(player.bid)}</b></span>
                    <span>Tricks <b>{player.tricksWon}</b></span>
                </div>
            </header>

            {isViewer ? (
                <PlayerHand
                    hand={hand}
                    legalCardIds={legalCardIds}
                    onPlayCard={onPlayCard}
                    disabled={!currentTurn}
                    seat={player.seat}
                />
            ) : (
                <div
                    className={`opponent-hand opponent-hand-${String(player.seat).toLowerCase()}`}
                    aria-label={`${player.cardCount} cards in hand`}
                >
                    <div className="opponent-card-grid">
                        <div className="opponent-card-count">{player.cardCount}</div>
                        {Array.from({ length: Math.min(player.cardCount, 13) }).map((_, index) => (
                            <span className="card-back" key={`${player.id}-${index}`} />
                        ))}
                    </div>
                    <span className="hidden-cards-label">cards hidden</span>
                </div>
            )}

            {!player.connected && <small className="seat-disconnected">Disconnected</small>}
        </section>
    );
}
