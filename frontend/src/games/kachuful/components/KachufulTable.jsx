import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import TrumpIndicator from "./TrumpIndicator";
import RoundInfo from "./RoundInfo";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import BidPanel from "./BidPanel";
import { getPlayableCards } from "../logic/rules";

function getSeatPosition(relativeIndex, total) {
    if (total === 4) {
        const positions = [
            { left: "50%", top: "9%", transform: "translate(-50%, -50%)" },
            { left: "93%", top: "50%", transform: "translate(-100%, -50%)" },
            { left: "50%", top: "91%", transform: "translate(-50%, -50%)" },
            { left: "7%", top: "50%", transform: "translate(0, -50%)" },
        ];
        return positions[relativeIndex];
    }

    const angle = (90 + (360 / total) * relativeIndex) * (Math.PI / 180);
    const x = 50 + Math.cos(angle) * 39;
    const y = 50 + Math.sin(angle) * 34;

    return {
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
    };
}

function orderPlayersForViewer(players, userId) {
    const userIndex = players.findIndex((player) => player.id === userId);
    if (userIndex <= 0) return players;

    return [...players.slice(userIndex), ...players.slice(0, userIndex)];
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
    const orderedPlayers = orderPlayersForViewer(players, userId);

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
        <div className="kachuful-game">
            <section className="kachuful-overview">
                <div className="kachuful-round-card">
                    <RoundInfo
                        round={gameState.round}
                        totalRounds={gameState.totalRounds}
                        cardsPerPlayer={gameState.cardsPerPlayer}
                    />
                </div>

                <div className="kachuful-turn-card">
                    <TurnIndicator
                        currentPlayer={currentPlayer}
                        isYourTurn={isYourTurn}
                    />
                </div>

                <div className="kachuful-trump-card">
                    <TrumpIndicator trump={gameState.trump} />
                </div>
            </section>

            <ScoreBoard players={players} userId={userId} />

            <section className="kachuful-table-wrap">
                <div className="kachuful-table">
                    <div className="kachuful-table-glow" aria-hidden="true" />
                    <div className="kachuful-table-border" aria-hidden="true" />

                    <div className="kachuful-table-center">
                        <div className="kachuful-center-label">
                            <span>LIVE TRICK</span>
                            <small>
                                {gameState.status === "bidding"
                                    ? "BIDDING IN PROGRESS"
                                    : gameState.status === "playing"
                                        ? "PLAYING"
                                        : gameState.status.replace("-", " ").toUpperCase()}
                            </small>
                        </div>

                        <TrickArea
                            trick={gameState.currentTrick}
                            players={players}
                            lastCompletedTrick={gameState.lastCompletedTrick}
                        />
                    </div>

                    {orderedPlayers.map((player, index) => {
                        const seat = getSeatPosition(index, orderedPlayers.length);

                        return (
                            <div
                                key={player.id}
                                className={`kachuful-seat-position ${player.id === userId ? "is-local-seat" : ""}`}
                                style={seat}
                            >
                                <PlayerSeat
                                    player={player}
                                    isCurrentTurn={player.id === gameState.currentPlayerId}
                                    isYou={player.id === userId}
                                />
                            </div>
                        );
                    })}

                    <div className="kachuful-table-caption">
                        <span>♠</span>
                        <strong>KACHUFUL</strong>
                        <span>♥</span>
                    </div>
                </div>
            </section>

            <section className="kachuful-bottom">
                {gameState.status === "bidding" && (
                    <BidPanel
                        cardsPerPlayer={gameState.cardsPerPlayer}
                        currentBid={selectedBid}
                        submitted={gameState.yourBid !== null && gameState.yourBid !== undefined}
                        onBid={onBidChange}
                        onBidConfirm={onBidConfirm}
                    />
                )}

                <div className="kachuful-hand-panel">
                    <div className="kachuful-hand-heading">
                        <div>
                            <span className="kachuful-eyebrow">YOUR HAND</span>
                            <strong>{gameState.yourCards?.length || 0} cards</strong>
                        </div>

                        <div className={`kachuful-hand-turn ${isYourTurn ? "is-active" : ""}`}>
                            <i />
                            {isYourTurn ? "Your turn" : `Waiting for ${currentPlayer?.username || "player"}`}
                        </div>
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
