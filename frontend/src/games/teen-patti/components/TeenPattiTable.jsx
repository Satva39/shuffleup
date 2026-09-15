import PlayerSeat from "./PlayerSeat";
import PlayerHand from "./PlayerHand";
import ActionPanel from "./ActionPanel";
import GameStatus from "./GameStatus";
import TurnIndicator from "./TurnIndicator";
import GameResult from "./GameResult";

function getSeatClass(seat, total) {
    if (total === 3) {
        return `teen-seat-3-${seat}`;
    }

    if (total === 4) {
        return `teen-seat-4-${seat}`;
    }

    if (total === 5) {
        return `teen-seat-5-${seat}`;
    }

    return `teen-seat-6-${seat}`;
}

function TeenPattiTable({
    gameState,
    error,
    connected,
    user,
    onAction,
    onPlayAgain,
    onLobby,
}) {
    if (!gameState) {
        return (
            <main className="teen-patti-page">
                <div className="teen-loading">
                    <div className="teen-loader" />
                    <h2>CONNECTING TO TABLE</h2>
                    <p>
                        Preparing your Teen Patti
                        game...
                    </p>
                </div>
            </main>
        );
    }

    const players = gameState.players || [];

    const localPlayer = players.find(
        (player) => player.id === user?.id
    );

    const currentPlayer = players.find(
        (player) =>
            player.id === gameState.currentPlayerId
    );

    const isMyTurn =
        gameState.currentPlayerId === user?.id &&
        localPlayer?.status === "active";

    const totalRounds = gameState.totalRounds || 11;

    const isComplete = gameState.status === "complete";
    const isRoundComplete = gameState.status === "round-complete";

    const isRoundWinner =
        isRoundComplete &&
        gameState.lastRoundResult?.winnerId === user?.id;

    return (
        <main className="teen-patti-page">
            <div className="teen-patti-game">

                <GameStatus
                    status={gameState.status}
                    currentPlayer={currentPlayer}
                    error={error}
                    connected={connected}
                    round={gameState.round}
                    totalRounds={gameState.totalRounds}
                />

                <div className="teen-table-wrapper">
                    <div className="teen-table">
                        <div className="teen-table-inner">
                            <div className="teen-table-brand">
                                <span>
                                    SHUFFLEUP
                                </span>

                                <strong>
                                    TEEN PATTI
                                </strong>
                            </div>

                            <div className="teen-pot">
                                <span>
                                    ROUND
                                </span>

                                <strong>
                                    {gameState.round} /{" "}
                                    {totalRounds}
                                </strong>
                            </div>

                            {players.map(
                                (player) => (
                                    <div
                                        key={player.id}
                                        className={`teen-seat ${getSeatClass(
                                            player.seat,
                                            players.length
                                        )}`}
                                    >
                                        <PlayerSeat
                                            player={player}
                                            isLocal={
                                                player.id ===
                                                user?.id
                                            }
                                            isTurn={
                                                player.id ===
                                                gameState.currentPlayerId
                                            }
                                        />
                                    </div>
                                )
                            )}

                            <div className="teen-center-deck">
                                <div className="teen-deck-card">
                                    <span>
                                        ♠
                                    </span>
                                </div>

                                <span>
                                    SHUFFLEUP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <TurnIndicator
                    isMyTurn={isMyTurn}
                    currentPlayer={
                        currentPlayer
                    }
                />

                <div className="teen-bottom-area">
                    {localPlayer &&
                        gameState.cards && (
                            <PlayerHand
                                cards={
                                    gameState.cards
                                }
                            />
                        )}

                    {!isComplete && !isRoundComplete && (
                        <ActionPanel
                            isMyTurn={isMyTurn}
                            legalActions={gameState.legalActions || []}
                            onAction={onAction}
                            disabled={!connected}
                        />
                    )}
                </div>

                {(isRoundComplete || isComplete) && (
                    <GameResult
                        result={gameState.result}
                        roundResult={gameState.lastRoundResult}
                        currentRound={gameState.round}
                        totalRounds={totalRounds}
                        isRoundResult={isRoundComplete}
                        isRoundWinner={isRoundWinner}
                        canStartNextRound={
                            isRoundComplete &&
                            gameState.legalActions?.includes("next-round")
                        }
                        onNextRound={() => onAction("next-round")}
                        onPlayAgain={onPlayAgain}
                        onLobby={onLobby}
                    />
                )}
            </div>
        </main>
    );
}

export default TeenPattiTable;