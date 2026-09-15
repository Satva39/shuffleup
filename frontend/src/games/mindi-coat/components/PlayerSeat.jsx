import React from "react";
import PlayerHand from "./PlayerHand";
import { SEAT_LABELS } from "../logic/cards";

export default function PlayerSeat({
    player,
    viewer,
    hand,
    legalCardIds,
    onPlayCard,
    currentTurn,
    trumpSelector,
}) {
    if (!player) return null;

    const isViewer = player.id === viewer?.id;
    const teamName = player.team === "A" ? "Team A" : "Team B";

    // After Hukum is placed, the hider temporarily has the hidden Hukum
    // removed from their private hand. Show a single card back for it.
    const hiddenHukumForViewer =
        isViewer &&
        !trumpSelector &&
        Number(player.cardCount) === Number(hand?.length || 0) + 1;

    // While selecting Hukum, the selector must not see any card faces.
    // The server sends only hidden slot tokens during this phase.
    const hiddenSelectionCards = Math.max(
        0,
        Number(player.cardCount) || Number(hand?.length) || 0
    );

    return (
        <section
            className={`mindi-seat ${isViewer ? "is-you" : ""} ${currentTurn ? "is-active" : ""
                }`}
        >
            <header className="mindi-seat-header">
                <div className="mindi-seat-person">
                    <div className="mindi-avatar">
                        {isViewer
                            ? "YOU"
                            : player.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    <div>
                        <strong>{isViewer ? "You" : player.username}</strong>
                        <span>
                            {SEAT_LABELS[player.seat] || player.seat} · {teamName}
                        </span>
                    </div>
                </div>

                <div className="mindi-seat-stats">
                    <span>
                        Tricks <b>{player.tricksWon ?? 0}</b>
                    </span>
                    <span>
                        Tens <b>{player.tensCaptured ?? 0}</b>
                    </span>
                </div>
            </header>

            {isViewer ? (
                trumpSelector ? (
                    <div
                        className="mindi-hukum-hidden-seat-hand"
                        aria-label="Your cards are hidden while you choose Hukum"
                    >
                        {Array.from({ length: hiddenSelectionCards }).map((_, index) => (
                            <span
                                className="mindi-card-back"
                                key={`hukum-hidden-${player.id}-${index}`}
                                aria-hidden="true"
                            />
                        ))}
                        <small>Cards hidden until Hukum is placed</small>
                    </div>
                ) : (
                    <>
                        <PlayerHand
                            hand={hand || []}
                            legalCardIds={legalCardIds || []}
                            onPlayCard={onPlayCard}
                            disabled={!currentTurn}
                        />

                        {hiddenHukumForViewer && (
                            <div
                                className="mindi-hidden-hukum-slot"
                                aria-label="Your hidden Hukum card"
                            >
                                <span
                                    className="mindi-card-back"
                                    aria-hidden="true"
                                />
                                <small>Hukum hidden</small>
                            </div>
                        )}
                    </>
                )
            ) : (
                <div
                    className="mindi-opponent-hand"
                    aria-label={`${player.cardCount ?? 0} cards hidden`}
                >
                    <div className="mindi-opponent-cards">
                        {Array.from({
                            length: Math.min(Number(player.cardCount) || 0, 13),
                        }).map((_, index) => (
                            <span
                                className="mindi-card-back"
                                key={`${player.id}-${index}`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <small>{player.cardCount ?? 0} cards</small>
                </div>
            )}

            {!player.connected && (
                <small className="mindi-disconnected">Disconnected</small>
            )}
        </section>
    );
}
