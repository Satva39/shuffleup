import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useKachufulSocket } from "../hooks/useKachufulSocket";

import KachufulTable from "../components/KachufulTable";
import GameResult from "../components/GameResult";

import "../styles/kachuful.css";

function KachufulGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedBid, setSelectedBid] =
        useState(null);

    const {
        gameState,
        error,
        connected,
        reconnecting,
        submitBid,
        playCard,
        nextRound,
    } = useKachufulSocket(
        roomCode,
        user
    );

    if (!user) {
        navigate("/login");
        return null;
    }


    if (!gameState) {
        return (
            <main className="kachuful-loading">
                <div>
                    <h2>
                        {reconnecting
                            ? "Reconnecting..."
                            : "Joining table..."}
                    </h2>

                    <p>
                        {reconnecting
                            ? "Restoring your seat..."
                            : "Preparing your Kachuful game."}
                    </p>
                </div>
            </main>
        );
    }

    function handleBidChange(bid) {
        setSelectedBid(bid);
    }

    function confirmBid() {
        if (selectedBid === null) return;

        submitBid(selectedBid);
    }

    function handleNextRound() {
        setSelectedBid(null);
        nextRound();
    }

    function handlePlayCard(card) {
        playCard(card.id);
    }

    function handlePlayAgain() {
        window.location.reload();
    }

    function handleLobby() {
        navigate("/lobby");
    }

    if (gameState.status === "game-complete") {
        return (
            <main className="kachuful-page">
                <GameResult
                    players={gameState.players}
                    onPlayAgain={handlePlayAgain}
                    onLobby={handleLobby}
                />
            </main>
        );
    }

    return (
        <main className="kachuful-page">
            {!connected && (
                <div className="kachuful-connection">
                    RECONNECTING...
                </div>
            )}

            {error && (
                <div className="kachuful-error">
                    {error}
                </div>
            )}

            <KachufulTable
                gameState={gameState}
                userId={user.id}
                selectedBid={selectedBid}
                onBidChange={handleBidChange}
                onBidConfirm={confirmBid}
                onPlayCard={handlePlayCard}
            />

            {gameState.status ===
                "round-complete" && (
                    <div className="kachuful-round-complete">
                        <div>
                            <span>
                                ROUND COMPLETE
                            </span>

                            <h2>
                                Round {gameState.round}
                            </h2>

                            <div className="round-results">
                                {gameState.players.map(
                                    (player) => (
                                        <div
                                            key={
                                                player.id
                                            }
                                        >
                                            <strong>
                                                {
                                                    player.username
                                                }
                                            </strong>

                                            <span>
                                                Bid{" "}
                                                {player.bid}
                                            </span>

                                            <span>
                                                Won{" "}
                                                {
                                                    player.tricksWon
                                                }
                                            </span>

                                            <b>
                                                +
                                                {
                                                    player.roundScore
                                                }
                                            </b>
                                        </div>
                                    )
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleNextRound}
                            >
                                {gameState.round >=
                                    gameState.totalRounds
                                    ? "Finish Game"
                                    : "Next Round"}
                            </button>
                        </div>
                    </div>
                )}
        </main>
    );
}

export default KachufulGame;