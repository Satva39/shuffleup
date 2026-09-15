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
    const [selectedBid, setSelectedBid] = useState(null);

    const {
        gameState,
        error,
        connected,
        reconnecting,
        submitBid,
        playCard,
        nextRound,
    } = useKachufulSocket(roomCode, user);

    if (!user) {
        navigate("/login");
        return null;
    }

    if (!gameState) {
        return (
            <main className="kachuful-page kachuful-loading-page">
                <section className="kachuful-loading">
                    <div className="kachuful-loading-mark">SU</div>
                    <span className="kachuful-eyebrow">SHUFFLEUP · KACHUFUL</span>
                    <h2>{reconnecting ? "RESTORING YOUR SEAT" : "JOINING THE TABLE"}</h2>
                    <p>
                        {reconnecting
                            ? "Reconnecting to the live game state…"
                            : "Preparing your cards and table…"}
                    </p>
                </section>
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
            <div className="kachuful-shell">
                <header className="kachuful-header">
                    <div className="kachuful-brand">
                        <div className="kachuful-brand-mark">SU</div>
                        <div>
                            <span>SHUFFLEUP</span>
                            <h1>Kachuful</h1>
                        </div>
                    </div>

                    <div className="kachuful-header-meta">
                        <div className="kachuful-room-pill">
                            <span>ROOM</span>
                            <strong>{roomCode?.toUpperCase()}</strong>
                        </div>

                        <div className={`kachuful-live-pill ${connected ? "is-live" : ""}`}>
                            <i />
                            {connected ? "LIVE TABLE" : "RECONNECTING"}
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="kachuful-error" role="alert">
                        <strong>Action unavailable</strong>
                        <span>{error}</span>
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

                {!connected && (
                    <div className="kachuful-reconnect-bar">
                        <span className="kachuful-spinner" />
                        Reconnecting to the live table…
                    </div>
                )}

                {gameState.status === "round-complete" && (
                    <div className="kachuful-round-complete">
                        <div className="kachuful-round-modal">
                            <div className="kachuful-modal-kicker">ROUND COMPLETE</div>
                            <h2>Round {gameState.round}</h2>
                            <p className="kachuful-modal-subtitle">
                                Review the round, then continue with the server-controlled next round.
                            </p>

                            <div className="round-results">
                                {gameState.players.map((player) => (
                                    <div className="round-result-row" key={player.id}>
                                        <div className="round-result-player">
                                            <span className="mini-avatar">
                                                {player.username?.charAt(0).toUpperCase()}
                                            </span>
                                            <strong>{player.username}</strong>
                                        </div>
                                        <span>{player.bid ?? "—"} bid</span>
                                        <span>{player.tricksWon} won</span>
                                        <b>+{player.roundScore}</b>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="kachuful-primary-button"
                                onClick={handleNextRound}
                            >
                                {gameState.round >= gameState.totalRounds ? "Finish Game" : "Next Round"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default KachufulGame;
