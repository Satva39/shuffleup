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
                <div className="kachuful-loading-card">
                    <div className="loading-mark" aria-hidden="true">
                        <span>♠</span>
                        <span>♥</span>
                        <span>♣</span>
                    </div>
                    <span className="eyebrow">KACHUFUL TABLE</span>
                    <h1>{reconnecting ? "Reconnecting to the table" : "Preparing your table"}</h1>
                    <p>
                        {reconnecting
                            ? "Restoring your seat and the latest game state…"
                            : "Joining the live game and dealing your table view…"}
                    </p>
                    <div className="loading-bar" aria-hidden="true"><span /></div>
                </div>
            </main>
        );
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
            <div className="kachuful-app-shell">
                <header className="kachuful-brandbar">
                    <div className="brand-lockup">
                        <div className="brand-mark" aria-hidden="true">S</div>
                        <div>
                            <strong>ShuffleUp</strong>
                            <span>Kachuful</span>
                        </div>
                    </div>
                    <div className="table-identity">
                        <span className="live-dot" />
                        <span>LIVE TABLE</span>
                        <b>{roomCode?.toUpperCase()}</b>
                    </div>
                    <div className="connection-pill">
                        <span className={connected ? "connection-dot online" : "connection-dot"} />
                        {connected ? "Connected" : reconnecting ? "Reconnecting" : "Offline"}
                    </div>
                </header>

                {!connected && (
                    <div className="kachuful-alert kachuful-alert-warning" role="status">
                        <span className="alert-icon">↻</span>
                        Reconnecting — your table will restore automatically.
                    </div>
                )}

                {error && (
                    <div className="kachuful-alert kachuful-alert-error" role="alert">
                        <span className="alert-icon">!</span>
                        {error}
                    </div>
                )}

                <KachufulTable
                    gameState={gameState}
                    userId={user.id}
                    selectedBid={selectedBid}
                    onBidChange={setSelectedBid}
                    onBidConfirm={confirmBid}
                    onPlayCard={handlePlayCard}
                />

                {gameState.status === "round-complete" && (
                    <div className="kachuful-overlay" role="dialog" aria-modal="true" aria-label="Round complete">
                        <div className="round-result-modal">
                            <div className="modal-kicker">ROUND {gameState.round} COMPLETE</div>
                            <h2>Table reset. Scores locked in.</h2>
                            <p className="modal-subtitle">Review the round, then continue from the same live table.</p>

                            <div className="round-result-list">
                                {gameState.players.map((player) => (
                                    <div className="round-result-row" key={player.id}>
                                        <div className="result-player">
                                            <span className="mini-avatar">
                                                {player.username?.charAt(0)?.toUpperCase() || "?"}
                                            </span>
                                            <div>
                                                <strong>{player.username}</strong>
                                                <small>Bid {player.bid ?? "—"} · Won {player.tricksWon}</small>
                                            </div>
                                        </div>
                                        <strong className={(player.roundScore || 0) >= 0 ? "positive-score" : "negative-score"}>
                                            {(player.roundScore || 0) >= 0 ? "+" : ""}{player.roundScore ?? 0}
                                        </strong>
                                        <span className="total-score">{player.score ?? 0}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="primary-action modal-action" type="button" onClick={handleNextRound}>
                                <span>{gameState.round >= gameState.totalRounds ? "Finish Game" : "Next Round"}</span>
                                <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default KachufulGame;
