import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useNapoleonSocket } from "../hooks/useNapoleonSocket";

import NapoleonTable from "../components/NapoleonTable";
import GameResult from "../components/GameResult";

import "../styles/napoleon.css";

function NapoleonGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        gameState,
        error,
        connected,
        reconnecting,
        submitBid,
        callPartner,
        discard,
        playCard,
        nextRound,
    } = useNapoleonSocket(roomCode, user);

    if (!user) {
        navigate("/login");
        return null;
    }

    if (!gameState) {
        return (
            <main className="napoleon-loading">
                <div>
                    <span>SHUFFLEUP</span>
                    <h1>{reconnecting ? "RECONNECTING" : error ? "TABLE CONNECTION FAILED" : "JOINING TABLE"}</h1>
                    <p>
                        {reconnecting
                            ? "Restoring your seat and private hand..."
                            : error
                                ? error
                                : "Preparing your live Napoleon table..."}
                    </p>

                    {error && !reconnecting && (
                        <button
                            type="button"
                            className="napoleon-loading-action"
                            onClick={() => window.location.reload()}
                        >
                            RELOAD TABLE
                        </button>
                    )}
                </div>
            </main>
        );
    }

    if (gameState.status === "game-complete") {
        return (
            <GameResult
                players={gameState.players}
                onPlayAgain={() => window.location.reload()}
                onLobby={() => navigate("/lobby")}
            />
        );
    }

    return (
        <main className="napoleon-page">
            {!connected && (
                <div className="napoleon-connection">
                    RECONNECTING...
                </div>
            )}

            {error && (
                <div className="napoleon-error">
                    {error}
                </div>
            )}

            <NapoleonTable
                gameState={gameState}
                userId={user.id}
                onBid={submitBid}
                onCallPartner={callPartner}
                onDiscard={discard}
                onPlayCard={playCard}
                onNextRound={nextRound}
            />
        </main>
    );
}

export default NapoleonGame;
