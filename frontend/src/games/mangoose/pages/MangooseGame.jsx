import {
    useNavigate,
    useParams,
} from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
    useMangooseSocket,
} from "../hooks/useMangooseSocket";
import {
    getOpponents,
    getPlayer,
} from "../logic/gameState";
import PlayerSeat from "../components/PlayerSeat";
import PlayerHand from "../components/PlayerHand";
import TrickArea from "../components/TrickArea";
import TurnIndicator from "../components/TurnIndicator";
import ActionPanel from "../components/ActionPanel";
import ScoreBoard from "../components/ScoreBoard";
import GameStatus from "../components/GameStatus";
import GameResult from "../components/GameResult";
import "../styles/mangoose.css";

function MangooseGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        gameState,
        connected,
        error,
        notice,
        sendAction,
    } = useMangooseSocket(
        roomCode,
        user
    );

    if (!user) {
        navigate("/login");
        return null;
    }

    if (!gameState) {
        return (
            <main className="mangoose-page">
                <div className="mangoose-loading">
                    <div className="mangoose-loader" />
                    <h2>
                        RESTORING YOUR SEAT...
                    </h2>
                    <p>
                        Connecting you to the live table.
                    </p>
                    {error && (
                        <span>{error}</span>
                    )}
                </div>
            </main>
        );
    }

    const localPlayer = getPlayer(
        gameState,
        user.id
    );

    const opponents = getOpponents(
        gameState,
        user.id
    );

    const currentPlayer = getPlayer(
        gameState,
        gameState.currentPlayerId
    );

    const isMyTurn =
        gameState.currentPlayerId ===
        user.id;

    const onCenterTarget = (suit) => {
        if (
            !isMyTurn ||
            !gameState.flippedCard ||
            !gameState.legalTargets.center.includes(
                suit
            )
        ) {
            return;
        }

        sendAction(
            "play-center",
            suit
        );
    };

    const onOpponentTarget = (
        playerId
    ) => {
        if (
            !isMyTurn ||
            !gameState.flippedCard ||
            !gameState.legalTargets.opponents.includes(
                playerId
            )
        ) {
            return;
        }

        sendAction(
            "play-opponent",
            playerId
        );
    };

    const onFlip = () => {
        if (!isMyTurn) {
            return;
        }

        sendAction("flip");
    };

    const onOpenPlay = () => {
        if (!isMyTurn) {
            return;
        }

        sendAction("play-open");
    };

    const onOwnDrop = () => {
        if (!isMyTurn) {
            return;
        }

        sendAction("play-own");
    };

    const onCallMongoose = (
        offenderId
    ) => {
        if (!gameState.canCallMongoose) {
            return;
        }

        sendAction(
            "call-mongoose",
            offenderId
        );
    };

    return (
        <main className="mangoose-page">
            <div className="mangoose-game">
                <GameStatus
                    connected={connected}
                    status={gameState.status}
                    pendingMongoose={
                        gameState.pendingMongoose
                    }
                    canCallMongoose={
                        gameState.canCallMongoose
                    }
                    notice={notice}
                    error={error}
                />

                <div className="mangoose-layout">
                    <div className="mangoose-table-wrap">
                        <div
                            className={`mangoose-table mangoose-players-${gameState.players.length}`}
                        >
                            {opponents.map(
                                (player) => (
                                    <PlayerSeat
                                        key={
                                            player.id
                                        }
                                        player={
                                            player
                                        }
                                        playerCount={
                                            gameState
                                                .players
                                                .length
                                        }
                                        localPlayerId={
                                            user.id
                                        }
                                        currentPlayerId={
                                            gameState.currentPlayerId
                                        }
                                        onOpponentTarget={
                                            onOpponentTarget
                                        }
                                    />
                                )
                            )}

                            <TrickArea
                                centerStacks={
                                    gameState.centerStacks
                                }
                                legalTargets={
                                    gameState.legalTargets
                                }
                                onCenterTarget={
                                    onCenterTarget
                                }
                            />
                        </div>

                        <TurnIndicator
                            isMyTurn={
                                isMyTurn
                            }
                            currentPlayer={
                                currentPlayer
                            }
                            pendingMongoose={
                                gameState.pendingMongoose
                            }
                            isMongooseOffender={
                                gameState.pendingMongoose?.offenderId ===
                                user.id
                            }
                        />
                    </div>

                    <ScoreBoard
                        players={
                            gameState.players
                        }
                    />
                </div>

                {localPlayer && (
                    <div className="mangoose-bottom">
                        <PlayerHand
                            closedCount={
                                gameState.closedCount
                            }
                            flippedCard={
                                gameState.flippedCard
                            }
                            openCount={
                                gameState.openCount
                            }
                            openTopCard={
                                gameState.openTopCard
                            }
                            canFlip={
                                isMyTurn &&
                                gameState.legalActions.includes(
                                    "flip"
                                )
                            }
                            canOpenPlay={
                                isMyTurn &&
                                gameState.legalActions.includes(
                                    "play-open"
                                )
                            }
                            onFlip={onFlip}
                            onOpenPlay={
                                onOpenPlay
                            }
                        />

                        <ActionPanel
                            legalActions={
                                gameState.legalActions
                            }
                            hasFlippedCard={
                                Boolean(
                                    gameState.flippedCard
                                )
                            }
                            legalTargets={
                                gameState.legalTargets
                            }
                            connected={
                                connected
                            }
                            pendingMongoose={
                                gameState.pendingMongoose
                            }
                            canCallMongoose={
                                gameState.canCallMongoose
                            }
                            onFlip={onFlip}
                            onOpenPlay={
                                onOpenPlay
                            }
                            onOwnDrop={
                                onOwnDrop
                            }
                            onCallMongoose={
                                onCallMongoose
                            }
                        />
                    </div>
                )}

                <GameResult
                    result={
                        gameState.result
                    }
                    players={
                        gameState.players
                    }
                    onLobby={() =>
                        navigate("/lobby")
                    }
                />
            </div>
        </main>
    );
}

export default MangooseGame;
