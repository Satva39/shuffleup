import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import TrumpIndicator from "./TrumpIndicator";
import RoundInfo from "./RoundInfo";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import BidPanel from "./BidPanel";
import { getPlayableCards } from "../logic/rules";

function getSeatClass(index, total) {
    if (total === 4) {
        return [
            "seat-top",
            "seat-right",
            "seat-bottom",
            "seat-left",
        ][index];
    }

    return `seat-dynamic seat-${index}`;
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

    const currentPlayer = players.find(
        (player) =>
            player.id ===
            gameState.currentPlayerId
    );

    const isYourTurn =
        gameState.currentPlayerId === userId;

    const playableCards = new Set(
        gameState.status === "playing" &&
            isYourTurn
            ? getPlayableCards(
                gameState.yourCards || [],
                gameState.currentTrick || []
            ).map((card) => card.id)
            : []
    );

    return (
        <div className="kachuful-table-wrapper">
            <div className="kachuful-top-bar">
                <RoundInfo
                    round={gameState.round}
                    totalRounds={
                        gameState.totalRounds
                    }
                    cardsPerPlayer={
                        gameState.cardsPerPlayer
                    }
                />

                <TrumpIndicator
                    trump={gameState.trump}
                />

                <ScoreBoard
                    players={players}
                />
            </div>

            <TurnIndicator
                currentPlayer={currentPlayer}
                isYourTurn={isYourTurn}
            />

            <main className="kachuful-table">
                {players.map((player, index) => (
                    <div
                        key={player.id}
                        className={`kachuful-seat-position ${getSeatClass(
                            index,
                            players.length
                        )}`}
                    >
                        <PlayerSeat
                            player={player}
                            isCurrentTurn={
                                player.id ===
                                gameState.currentPlayerId
                            }
                            isYou={
                                player.id === userId
                            }
                        />
                    </div>
                ))}

                <TrickArea
                    trick={gameState.currentTrick}
                    players={players}
                    lastCompletedTrick={
                        gameState.lastCompletedTrick
                    }
                />

                <div className="kachuful-your-hand">
                    <PlayerHand
                        cards={
                            gameState.yourCards || []
                        }
                        playableCards={
                            gameState.status ===
                                "playing" &&
                                isYourTurn
                                ? playableCards
                                : new Set()
                        }
                        onPlayCard={
                            onPlayCard
                        }
                    />
                </div>

                {gameState.status ===
                    "bidding" && (
                        <BidPanel
                            cardsPerPlayer={
                                gameState.cardsPerPlayer
                            }
                            currentBid={
                                selectedBid
                            }
                            submitted={
                                gameState.yourBid !==
                                null
                            }
                            onBid={
                                onBidChange
                            }
                            onBidConfirm={
                                onBidConfirm
                            }
                        />
                    )}
            </main>
        </div>
    );
}

export default KachufulTable;