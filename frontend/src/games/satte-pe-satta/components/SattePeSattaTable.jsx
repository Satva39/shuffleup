import React from "react";
import CardLayout from "./CardLayout";
import PlayerHand from "./PlayerHand";
import PlayerSeat from "./PlayerSeat";
import ScoreBoard from "./ScoreBoard";
import GameStatus from "./GameStatus";
import LegalMoveHint from "./LegalMoveHint";
import GameResult from "./GameResult";

export default function SattePeSattaTable({ state, user, error, connected, playCard, pass, onLobby }) {
    const meTurn = state.currentPlayerId === user.id && state.status === "playing";
    const legalMoves = state.me?.legalMoves || [];
    const legalCards = (state.me?.hand || []).filter((card) => legalMoves.includes(card.id));

    return (
        <main className="sps-page">
            <div className="sps-shell">
                <GameStatus state={state} userId={user.id} connected={connected} />

                {state.status === "round-complete" && <GameResult state={state} />}

                {error && <div className="sps-error">{error}</div>}

                <div className="sps-player-strip">
                    {state.players.map((player) => (
                        <PlayerSeat key={player.id} player={player} active={player.id === state.currentPlayerId} isMe={player.id === user.id} />
                    ))}
                </div>

                <div className="sps-main-grid">
                    <section className="sps-table-card">
                        <div className="sps-table-topline">
                            <div>
                                <span className="sps-eyebrow">THE TABLE</span>
                                <strong>Build every suit out from the 7</strong>
                            </div>
                            <div className="sps-round-meta">Turn {state.turnNumber}</div>
                        </div>
                        <CardLayout layout={state.layout} />
                        <LegalMoveHint cards={legalCards} />
                        <div className="sps-action-bar">
                            <button className="sps-pass-button" type="button" onClick={pass} disabled={!meTurn || legalMoves.length > 0}>PASS</button>
                            <span>{meTurn ? (legalMoves.length ? "Choose a highlighted card." : "No legal card is available.") : "Wait for the current player."}</span>
                        </div>
                    </section>

                    <ScoreBoard players={state.players} />
                </div>

                <PlayerHand hand={state.me?.hand || []} legalMoves={legalMoves} onPlayCard={playCard} disabled={!meTurn} />
                <GameResult state={state} onLobby={onLobby} />
            </div>
        </main>
    );
}
