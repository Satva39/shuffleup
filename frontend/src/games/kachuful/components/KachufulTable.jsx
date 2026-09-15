import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import TrumpIndicator from "./TrumpIndicator";
import RoundInfo from "./RoundInfo";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import BidPanel from "./BidPanel";
import { getPlayableCards } from "../logic/rules";

function arrangePlayers(players, userId) {
    const selfIndex = players.findIndex((player) => player.id === userId);
    if (selfIndex < 0) return players;
    return [...players.slice(selfIndex), ...players.slice(0, selfIndex)];
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
    const tablePlayers = arrangePlayers(players, userId);
    const currentPlayer = players.find((player) => player.id === gameState.currentPlayerId);
    const isYourTurn = gameState.currentPlayerId === userId;

    const playableCards = new Set(
        gameState.status === "playing" && isYourTurn
            ? getPlayableCards(gameState.yourCards || [], gameState.currentTrick || []).map((card) => card.id)
            : []
    );

    return (
        <div className="kachuful-game-space">
            <div className="kachuful-context-row">
                <RoundInfo
                    round={gameState.round}
                    totalRounds={gameState.totalRounds}
                    cardsPerPlayer={gameState.cardsPerPlayer}
                />
                <TrumpIndicator trump={gameState.trump} />
                <TurnIndicator currentPlayer={currentPlayer} isYourTurn={isYourTurn} status={gameState.status} />
                <ScoreBoard players={players} userId={userId} />
            </div>

            <section className={`kachuful-table kachuful-status-${gameState.status}`} aria-label="Kachuful table">
                <div className="table-felt-glow" aria-hidden="true" />
                <div className="table-rim" aria-hidden="true" />
                <div className="table-caption">
                    <span className="table-caption-kicker">KACHUFUL</span>
                    <strong>{gameState.status === "bidding" ? "Bidding phase" : gameState.status === "playing" ? "Trick in play" : "Table ready"}</strong>
                </div>

                {tablePlayers.map((player, index) => {
                    const angle = (Math.PI / 2) + (index * (Math.PI * 2 / Math.max(tablePlayers.length, 1)));
                    const x = 50 + Math.cos(angle) * 43;
                    const y = 50 + Math.sin(angle) * 39;
                    const seatPosition = {
                        left: `${x}%`,
                        top: `${y}%`,
                    };

                    return (
                        <div className="kachuful-seat-position" style={seatPosition} key={player.id}>
                            <PlayerSeat
                                player={player}
                                isCurrentTurn={player.id === gameState.currentPlayerId}
                                isYou={player.id === userId}
                            />
                        </div>
                    );
                })}

                <TrickArea
                    trick={gameState.currentTrick || []}
                    players={players}
                    lastCompletedTrick={gameState.lastCompletedTrick}
                    currentPlayerId={gameState.currentPlayerId}
                />

                <div className="table-state-pod">
                    <div>
                        <span>TRUMP</span>
                        <strong>{gameState.trump?.symbol || "—"}</strong>
                    </div>
                    <div>
                        <span>ROUND</span>
                        <strong>{gameState.round}/{gameState.totalRounds}</strong>
                    </div>
                    <div>
                        <span>CARDS</span>
                        <strong>{gameState.cardsPerPlayer}</strong>
                    </div>
                </div>

                <div className="kachuful-your-area">
                    <div className="your-hand-heading">
                        <div>
                            <span className="your-hand-kicker">YOUR HAND</span>
                            <strong>{gameState.yourCards?.length || 0} cards</strong>
                        </div>
                        <span className={isYourTurn ? "hand-turn-tag active" : "hand-turn-tag"}>
                            {isYourTurn ? "Your turn" : currentPlayer ? `${currentPlayer.username}'s turn` : "Waiting"}
                        </span>
                    </div>

                    <PlayerHand
                        cards={gameState.yourCards || []}
                        playableCards={gameState.status === "playing" && isYourTurn ? playableCards : new Set()}
                        onPlayCard={onPlayCard}
                    />
                </div>

                {gameState.status === "bidding" && (
                    <BidPanel
                        cardsPerPlayer={gameState.cardsPerPlayer}
                        currentBid={selectedBid}
                        submitted={gameState.yourBid !== null}
                        onBid={onBidChange}
                        onBidConfirm={onBidConfirm}
                    />
                )}
            </section>
        </div>
    );
}

export default KachufulTable;
