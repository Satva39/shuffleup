import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import TrumpIndicator from "./TrumpIndicator";
import RoundInfo from "./RoundInfo";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import BidPanel from "./BidPanel";
import { getPlayableCards } from "../logic/rules";

function getSeatStyle(index, total) {
    const angle = Math.PI / 2 + (index * Math.PI * 2) / total;
    const radiusX = total >= 8 ? 38 : 40;
    const radiusY = total >= 8 ? 34 : 36;

    return {
        left: `${50 + Math.cos(angle) * radiusX}%`,
        top: `${50 + Math.sin(angle) * radiusY}%`,
    };
}

function getOrderedPlayers(players, userId) {
    if (!players.length) return [];

    const userIndex = players.findIndex(
        (player) => player.id === userId
    );

    if (userIndex < 0) return players;

    return [
        ...players.slice(userIndex),
        ...players.slice(0, userIndex),
    ];
}

function KachufulTable({
    gameState,
    userId,
    selectedBid,
    onBidChange,
    onBidConfirm,
    onPlayCard,
}) {
    const players = gameState?.players || [];
    const orderedPlayers = getOrderedPlayers(players, userId);
    const currentPlayer = players.find(
        (player) => player.id === gameState.currentPlayerId
    );

    const isYourTurn = gameState.currentPlayerId === userId;

    const playableCards = new Set(
        gameState.status === "playing" && isYourTurn
            ? getPlayableCards(
                gameState.yourCards || [],
                gameState.currentTrick || []
            ).map((card) => card.id)
            : []
    );

    return (
        <div className="kachuful-table-wrapper">
            <header className="kachuful-game-header">
                <div className="kachuful-header-left">
                    <RoundInfo
                        round={gameState.round}
                        totalRounds={gameState.totalRounds}
                        cardsPerPlayer={gameState.cardsPerPlayer}
                    />
                    <TrumpIndicator trump={gameState.trump} />
                </div>

                <TurnIndicator
                    currentPlayer={currentPlayer}
                    isYourTurn={isYourTurn}
                />

                <div className="kachuful-header-right">
                    <ScoreBoard players={players} />
                </div>
            </header>

            <section className="kachuful-play-space">
                <div className="kachuful-table-shadow" />
                <div className="kachuful-table">
                    <div className="table-inner-ring" />
                    <div className="table-center-glow" />

                    {orderedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className="kachuful-seat-position"
                            style={getSeatStyle(index, orderedPlayers.length)}
                        >
                            <PlayerSeat
                                player={player}
                                isCurrentTurn={
                                    player.id === gameState.currentPlayerId
                                }
                                isYou={player.id === userId}
                                compact={orderedPlayers.length >= 8}
                            />
                        </div>
                    ))}

                    <TrickArea
                        trick={gameState.currentTrick}
                        players={players}
                        lastCompletedTrick={gameState.lastCompletedTrick}
                    />
                </div>

                {gameState.status === "bidding" && (
                    <div className="kachuful-action-dock">
                        <BidPanel
                            cardsPerPlayer={gameState.cardsPerPlayer}
                            currentBid={selectedBid}
                            submitted={gameState.yourBid !== null}
                            onBid={onBidChange}
                            onBidConfirm={onBidConfirm}
                        />
                    </div>
                )}

                <div className="kachuful-hand-dock">
                    <div className="hand-dock-label-row">
                        <span>YOUR HAND</span>
                        <span>
                            {gameState.yourCards?.length || 0} cards
                        </span>
                    </div>
                    <PlayerHand
                        cards={gameState.yourCards || []}
                        playableCards={
                            gameState.status === "playing" && isYourTurn
                                ? playableCards
                                : new Set()
                        }
                        onPlayCard={onPlayCard}
                    />
                </div>
            </section>
        </div>
    );
}

export default KachufulTable;
