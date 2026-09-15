import { useEffect, useMemo, useState } from "react";
import BattleArea from "./BattleArea";
import GameResult from "./GameResult";
import GameStatus from "./GameStatus";
import PlayerSeat from "./PlayerSeat";
import WarIndicator from "./WarIndicator";

function positionFor(index, total) {
    if (total === 2) return index === 0 ? "south" : "north";
    return ["south", "west", "north", "east"][index] || "south";
}

export default function WarTable({ state, user, error, connected, onLobby }) {
    const me = useMemo(() => state.players.find((player) => player.id === user.id), [state.players, user.id]);
    const opponent = useMemo(() => state.players.find((player) => player.id !== user.id), [state.players, user.id]);
    const showStart = state.phase === "ready" && state.players.every((player) => player.connected) && state.status === "playing";
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (state.phase !== "battle-result" || !state.nextBattleAt) {
            setCountdown(0);
            return undefined;
        }

        const update = () => {
            setCountdown(Math.max(0, Math.ceil((state.nextBattleAt - Date.now()) / 1000)));
        };

        update();
        const timer = window.setInterval(update, 100);
        return () => window.clearInterval(timer);
    }, [state.phase, state.nextBattleAt]);

    return (
        <main className="war-page">
            <div className="war-shell">
                <header className="war-header">
                    <div>
                        <span className="war-eyebrow">SHUFFLEUP · GAME 14</span>
                        <h1>WAR</h1>
                        <p>Highest card wins the battle. Equal cards trigger War.</p>
                    </div>
                    <div className="war-room-pill">ROOM {state.roomCode}</div>
                </header>

                <GameStatus state={state} connected={connected} />
                {error && <div className="war-error">{error}</div>}

                <section className="war-table-wrap">
                    <div className="war-table">
                        <div className="war-table-rim" />
                        <div className="war-table-felt" />
                        <div className="war-table-center-line" />

                        {state.players.map((player, index) => (
                            <PlayerSeat
                                key={player.id}
                                player={player}
                                viewerId={user.id}
                                active={!player.eliminated && (state.revealedCards || []).some((card) => card.playerId === player.id)}
                                position={positionFor(index, state.players.length)}
                            />
                        ))}

                        <div className="war-center-content">
                            <WarIndicator state={state} />
                            <BattleArea state={{ ...state, playerId: user.id }} />
                            {state.phase === "ready" && <div className="war-waiting">Waiting for both players to connect.</div>}
                            {state.phase === "battle-result" && state.status === "playing" && (
                                <div className="war-next-message">
                                    <strong>{countdown > 0 ? `NEXT BATTLE IN ${countdown}` : "NEXT BATTLE STARTING…"}</strong>
                                    <span>Both cards were revealed automatically. No player action is required.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="war-bottom-panel">
                    <div>
                        <span className="war-panel-label">YOUR PILE</span>
                        <strong>{me?.cardCount ?? state.yourCardCount ?? 0} CARDS</strong>
                    </div>
                    <div className="war-bottom-copy">
                        <span>Opponent</span>
                        <strong>{opponent?.cardCount ?? 0} cards</strong>
                    </div>
                    <button type="button" className="war-secondary-btn" onClick={onLobby}>Leave table</button>
                </section>

                {showStart && <div className="war-autostart-note">The server will start the first battle automatically.</div>}
            </div>
            <GameResult state={state} onLobby={onLobby} />
        </main>
    );
}
