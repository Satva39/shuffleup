import React, { useEffect, useMemo, useState } from "react";
import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import CentralPile from "./CentralPile";
import ClaimPanel from "./ClaimPanel";
import ChallengePanel from "./ChallengePanel";
import TurnIndicator from "./TurnIndicator";
import ClaimHistory from "./ClaimHistory";
import ChallengeResult from "./ChallengeResult";
import PenaltyNotice from "./PenaltyNotice";
import GameStatus from "./GameStatus";
import GameResult from "./GameResult";
import { MAX_CARDS_PER_CLAIM } from "../logic/rules";

function seatPosition(index, total) {
    const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
    return {
        left: `${50 + Math.cos(angle) * 43}%`,
        top: `${50 + Math.sin(angle) * 38}%`,
    };
}

export default function BluffTable({ state, user, error, connected, playCards, challenge }) {
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        setSelectedIds([]);
    }, [state?.currentPlayerId, state?.phase, state?.currentClaim?.id]);

    const selectableIds = state?.selectableCardIds || [];
    const me = useMemo(() => state.players?.find((player) => player.id === user.id), [state.players, user.id]);

    function toggleCard(cardId) {
        if (!selectableIds.includes(cardId)) return;
        setSelectedIds((current) => {
            if (current.includes(cardId)) return current.filter((id) => id !== cardId);
            if (current.length >= MAX_CARDS_PER_CLAIM) return current;
            return [...current, cardId];
        });
    }

    function submitCards() {
        if (!selectedIds.length) return;
        playCards(selectedIds);
    }

    return (
        <main className="bluff-page">
            <header className="bluff-header">
                <div>
                    <span className="eyebrow">SHUFFLEUP · GAME 12</span>
                    <h1>BLUFF <em>/ CHEAT</em></h1>
                </div>
                <div className="bluff-room-pill">ROOM {state.roomCode}</div>
            </header>

            <GameStatus state={state} connected={connected} />

            {error && <div className="bluff-error">{error}</div>}

            <section className="bluff-layout">
                <div className="bluff-main-column">
                    <div className="bluff-table">
                        <div className="bluff-table-glow" />
                        <div className="bluff-turn-slot"><TurnIndicator state={state} localPlayerId={user.id} /></div>
                        <div className="bluff-center">
                            <CentralPile pileCount={state.pileCount} claim={state.currentClaim} requiredRank={state.requiredRank} />
                        </div>

                        {state.players.map((player, index) => (
                            <div
                                key={player.id}
                                className="bluff-seat-position"
                                style={seatPosition(index, state.players.length)}
                            >
                                <PlayerSeat
                                    player={player}
                                    viewerId={user.id}
                                    active={player.id === state.currentPlayerId}
                                />
                            </div>
                        ))}

                        <div className="bluff-table-mark">♣ &nbsp; A → 2 → 3 → … → K &nbsp; ♣</div>
                    </div>

                    <section className="bluff-bottom-panel">
                        <div className="bluff-your-hand-head">
                            <div>
                                <span className="eyebrow">YOUR HAND</span>
                                <strong>{me?.cardCount ?? state.hand?.length ?? 0} CARDS</strong>
                            </div>
                            <span>{state.currentPlayerId === user.id && state.phase === "play" ? "Select cards, then play face-down" : "Watch the table"}</span>
                        </div>

                        <PlayerHand
                            hand={state.hand}
                            selectedIds={selectedIds}
                            selectableIds={selectableIds}
                            disabled={!state.canPlay}
                            onToggle={toggleCard}
                        />
                    </section>

                </div>

                <aside className="bluff-side-column">
                    <ClaimHistory history={state.claimHistory} />

                    <div className="bluff-action-row bluff-sidebar-actions">
                        <ClaimPanel
                            requiredRank={state.requiredRank}
                            selectedCount={selectedIds.length}
                            canPlay={state.canPlay}
                            onPlay={submitCards}
                            maxCards={MAX_CARDS_PER_CLAIM}
                        />
                        <ChallengePanel
                            claim={state.currentClaim}
                            canChallenge={state.canChallenge}
                            onChallenge={challenge}
                        />
                    </div>
                </aside>
            </section>

            <ChallengeResult result={state.lastChallenge} />
            <PenaltyNotice result={state.lastChallenge} localPlayerId={user.id} />
            <GameResult state={state} localPlayerId={user.id} />
        </main>
    );
}
