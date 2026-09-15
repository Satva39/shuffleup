import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useJackThiefSocket } from "../hooks/useJackThiefSocket";
import { getTargetPlayer, isMyTurn } from "../logic/gameState";
import JackThiefTable from "../components/JackThiefTable";
import PlayerHand from "../components/PlayerHand";
import ActionPanel from "../components/ActionPanel";
import TurnIndicator from "../components/TurnIndicator";
import GameStatus from "../components/GameStatus";
import GameResult from "../components/GameResult";
import "../styles/jackThief.css";

function JackThiefGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { gameState, connected, error, notice, drawCard } = useJackThiefSocket(roomCode, user);

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!gameState) {
        return (
            <main className="jt-page">
                <div className="jt-loading">
                    <div className="jt-loader" />
                    <h1>RESTORING YOUR SEAT...</h1>
                    <p>{error || "Connecting you to the live Jack Thief table."}</p>
                </div>
            </main>
        );
    }

    const hand = gameState.hand || [];
    const target = getTargetPlayer(gameState, user.id);
    const myTurn = isMyTurn(gameState, user.id);

    return (
        <main className="jt-page">
            <div className="jt-game">
                <GameStatus
                    connected={connected}
                    status={gameState.status}
                    notice={notice}
                    error={error}
                />

                <TurnIndicator state={gameState} localPlayerId={user.id} />

                <JackThiefTable
                    state={gameState}
                    localPlayerId={user.id}
                    onDraw={drawCard}
                />

                <section className="jt-bottom-area">
                    <PlayerHand cards={hand} disabled={!myTurn} />
                    <ActionPanel
                        isMyTurn={myTurn}
                        target={target}
                        connected={connected}
                    />
                </section>

                <GameResult state={gameState} onLobby={() => navigate("/lobby")} />
            </div>
        </main>
    );
}

export default JackThiefGame;
