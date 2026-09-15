import React, { useMemo, useState } from "react";
import BidPanel from "./BidPanel";
import BidDisplay from "./BidDisplay";
import GameResult from "./GameResult";
import GameStatus from "./GameStatus";
import HandResult from "./HandResult";
import PlayerSeat from "./PlayerSeat";
import ScoreBoard from "./ScoreBoard";
import TrickArea from "./TrickArea";
import TurnIndicator from "./TurnIndicator";
import { bidLabel } from "../logic/bidding";

export default function SpadesTable({ state, user, error, submitBid, playCard, nextHand }) {
    const [selectedBid, setSelectedBid] = useState(null);
    const viewer = useMemo(
        () => state.players.find((player) => player.id === user.id),
        [state.players, user.id]
    );

    const seatPlayers = { N: null, E: null, S: null, W: null };
    state.players.forEach((player) => {
        seatPlayers[player.seat] = player;
    });

    const submit = async () => {
        if (selectedBid === null) return;
        const result = await submitBid(selectedBid);
        if (result?.success) setSelectedBid(null);
    };

    const isViewerTurn = state.phase === "trick-play" && state.turnActorId === user.id;
    const hasSubmittedBid = viewer?.bid !== null && viewer?.bid !== undefined;

    return (
        <main className="spades-page">
            <div className="spades-shell">
                <header className="spades-topbar">
                    <div className="brand-lockup">
                        <div className="brand-mark">SU</div>
                        <div>
                            <p>SHUFFLEUP</p>
                            <h1>Spades</h1>
                        </div>
                    </div>
                    <GameStatus
                        phase={state.phase}
                        handNumber={state.handNumber}
                        targetScore={state.targetScore}
                    />
                </header>

                <ScoreBoard
                    players={state.players}
                    scores={state.scores}
                    bags={state.bags}
                />

                <section className="spades-table-wrap">
                    <div className="table-glow" aria-hidden="true" />

                    <div className="spades-table">
                        <div className="table-ornament table-ornament-left" aria-hidden="true" />
                        <div className="table-ornament table-ornament-right" aria-hidden="true" />

                        <div className="table-seat table-seat-north">
                            <PlayerSeat
                                player={seatPlayers.N}
                                viewer={viewer}
                                hand={viewer?.seat === "N" ? state.hand : []}
                                legalCardIds={viewer?.seat === "N" ? state.legalCardIds : []}
                                onPlayCard={playCard}
                                currentTurn={state.currentSeat === "N" && isViewerTurn}
                            />
                        </div>

                        <div className="table-seat table-seat-west">
                            <PlayerSeat
                                player={seatPlayers.W}
                                viewer={viewer}
                                hand={viewer?.seat === "W" ? state.hand : []}
                                legalCardIds={viewer?.seat === "W" ? state.legalCardIds : []}
                                onPlayCard={playCard}
                                currentTurn={state.currentSeat === "W" && isViewerTurn}
                            />
                        </div>

                        <div className="table-center">
                            <div className="table-center-topline">
                                <TurnIndicator
                                    seat={state.currentSeat}
                                    phase={state.phase}
                                    spadesBroken={state.spadesBroken}
                                />
                            </div>

                            <TrickArea
                                trick={state.trick}
                                trickCount={state.trickCount}
                                winnerSeat={state.handResult?.winnerSeat || state.lastTrickWinner}
                            />

                            <div className="table-info-strip">
                                <span>Hand {state.handNumber}</span>
                                <span>{state.trickCount} / 13 tricks</span>
                                <span className={state.spadesBroken ? "is-broken" : ""}>
                                    ♠ {state.spadesBroken ? "Broken" : "Unbroken"}
                                </span>
                            </div>
                        </div>

                        <div className="table-seat table-seat-east">
                            <PlayerSeat
                                player={seatPlayers.E}
                                viewer={viewer}
                                hand={viewer?.seat === "E" ? state.hand : []}
                                legalCardIds={viewer?.seat === "E" ? state.legalCardIds : []}
                                onPlayCard={playCard}
                                currentTurn={state.currentSeat === "E" && isViewerTurn}
                            />
                        </div>

                        <div className="table-seat table-seat-south">
                            <PlayerSeat
                                player={seatPlayers.S}
                                viewer={viewer}
                                hand={viewer?.seat === "S" ? state.hand : []}
                                legalCardIds={viewer?.seat === "S" ? state.legalCardIds : []}
                                onPlayCard={playCard}
                                currentTurn={state.currentSeat === "S" && isViewerTurn}
                            />
                        </div>
                    </div>
                </section>

                <section className="spades-below-table">
                    <BidDisplay players={state.players} />

                    {error && <div className="spades-error">{error}</div>}

                    {state.phase === "bidding" && state.turnActorId === user.id && !hasSubmittedBid && (
                        <BidPanel
                            options={state.bidOptions}
                            selected={selectedBid}
                            onSelect={setSelectedBid}
                            onSubmit={submit}
                            disabled={false}
                        />
                    )}

                    {state.phase === "bidding" && hasSubmittedBid && (
                        <div className="waiting-note">
                            <span>Your bid</span>
                            <strong>{bidLabel(viewer.bid)}</strong>
                            <small>Waiting for the other players…</small>
                        </div>
                    )}

                    <HandResult result={state.handResult} />
                    <GameResult winnerTeam={state.winnerTeam} scores={state.scores} />

                    {state.phase === "hand-complete" && !state.winnerTeam && viewer?.seat === state.dealer && (
                        <button className="primary-button next-hand" type="button" onClick={nextHand}>
                            Start Next Hand
                        </button>
                    )}
                </section>
            </div>
        </main>
    );
}
