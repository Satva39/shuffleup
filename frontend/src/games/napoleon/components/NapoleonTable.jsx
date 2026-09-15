import { useMemo } from "react";

import { legalHandCards, getPlayerName } from "../logic/gameState";

import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import BidPanel from "./BidPanel";
import TrumpSelector from "./TrumpSelector";
import ActionPanel from "./ActionPanel";
import TurnIndicator from "./TurnIndicator";
import GameStatus from "./GameStatus";
import RoundInfo from "./RoundInfo";
import ScoreBoard from "./ScoreBoard";

function NapoleonTable({
    gameState,
    userId,
    onBid,
    onCallPartner,
    onDiscard,
    onPlayCard,
    onNextRound,
}) {
    const userCards = gameState.yourCards || [];
    const legalIds = useMemo(
        () => legalHandCards(gameState, userCards, userId),
        [gameState, userCards, userId]
    );

    const currentPlayerName = getPlayerName(
        gameState.players,
        gameState.currentPlayerId
    );

    const opponentSeats = gameState.players.filter(
        (player) => player.id !== userId
    );

    return (
        <div className="napoleon-shell">
            <header className="napoleon-topbar">
                <div>
                    <span className="brand-mini">SHUFFLEUP</span>
                    <h1>NAPOLEON</h1>
                </div>
                <GameStatus gameState={gameState} />
            </header>

            <div className="napoleon-layout">
                <section className="table-column">
                    <div className="napoleon-table">
                        <div className="table-glow" />

                        <div className="seat-row seat-row-top">
                            {opponentSeats
                                .slice(0, 2)
                                .map((player) => (
                                    <PlayerSeat
                                        key={player.id}
                                        player={player}
                                        active={
                                            gameState.currentPlayerId ===
                                            player.id
                                        }
                                        napoleon={
                                            gameState.napoleonId === player.id
                                        }
                                        partner={
                                            gameState.partnerRevealed &&
                                            gameState.partnerId === player.id
                                        }
                                    />
                                ))}
                        </div>

                        <div className="table-middle">
                            <div className="side-seat">
                                {opponentSeats[2] && (
                                    <PlayerSeat
                                        player={opponentSeats[2]}
                                        active={
                                            gameState.currentPlayerId ===
                                            opponentSeats[2].id
                                        }
                                        napoleon={
                                            gameState.napoleonId ===
                                            opponentSeats[2].id
                                        }
                                        partner={
                                            gameState.partnerRevealed &&
                                            gameState.partnerId ===
                                            opponentSeats[2].id
                                        }
                                    />
                                )}
                            </div>

                            <div className="center-zone">
                                <RoundInfo gameState={gameState} />
                                <TrickArea
                                    trick={gameState.currentTrick}
                                    players={gameState.players}
                                    lastCompletedTrick={
                                        gameState.lastCompletedTrick
                                    }
                                />
                            </div>

                            <div className="side-seat">
                                {opponentSeats[3] && (
                                    <PlayerSeat
                                        player={opponentSeats[3]}
                                        active={
                                            gameState.currentPlayerId ===
                                            opponentSeats[3].id
                                        }
                                        napoleon={
                                            gameState.napoleonId ===
                                            opponentSeats[3].id
                                        }
                                        partner={
                                            gameState.partnerRevealed &&
                                            gameState.partnerId ===
                                            opponentSeats[3].id
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        <div className="local-seat-area">
                            <TurnIndicator
                                yourTurn={
                                    gameState.currentPlayerId === userId
                                }
                                currentPlayerName={currentPlayerName}
                                phase={gameState.phase}
                            />
                            <PlayerSeat
                                player={
                                    gameState.players.find(
                                        (player) =>
                                            player.id === userId
                                    ) || {
                                        id: userId,
                                        username: "You",
                                        cardCount: userCards.length,
                                    }
                                }
                                you
                                active={
                                    gameState.currentPlayerId === userId
                                }
                                napoleon={
                                    gameState.napoleonId === userId
                                }
                                partner={
                                    gameState.partnerRevealed &&
                                    gameState.partnerId === userId
                                }
                            />
                            <PlayerHand
                                cards={userCards}
                                selectedIds={new Set()}
                                disabledIds={
                                    gameState.phase === "playing"
                                        ? new Set(
                                            userCards
                                                .filter(
                                                    (card) =>
                                                        !legalIds.has(
                                                            card.id
                                                        )
                                                )
                                                .map(
                                                    (card) => card.id
                                                )
                                        )
                                        : new Set()
                                }
                                onCardClick={(card) => {
                                    if (
                                        gameState.phase !== "playing" ||
                                        !legalIds.has(card.id)
                                    ) {
                                        return;
                                    }

                                    onPlayCard(card.id);
                                }}
                            />
                        </div>
                    </div>

                    <div className="below-table">
                        <TrumpSelector
                            gameState={gameState}
                            userId={userId}
                            onCallPartner={onCallPartner}
                        />
                        <ActionPanel
                            gameState={gameState}
                            userId={userId}
                            onDiscard={onDiscard}
                            onNextRound={onNextRound}
                        />
                    </div>
                </section>

                <aside className="sidebar-column">
                    <ScoreBoard players={gameState.players} />
                    <BidPanel
                        gameState={gameState}
                        userId={userId}
                        onBid={onBid}
                    />
                </aside>
            </div>
        </div>
    );
}

export default NapoleonTable;
