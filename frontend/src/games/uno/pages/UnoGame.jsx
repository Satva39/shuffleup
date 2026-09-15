import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useUnoSocket } from "../hooks/useUnoSocket";
import { ACTIONS } from "../logic/cards";
import { getPlayer } from "../logic/gameState";
import UnoTable from "../components/UnoTable";
import PlayerHand from "../components/PlayerHand";
import ActionPanel from "../components/ActionPanel";
import ColorPicker from "../components/ColorPicker";
import ScoreBoard from "../components/ScoreBoard";
import GameStatus from "../components/GameStatus";
import GameResult from "../components/GameResult";
import "../styles/uno.css";

function UnoGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { gameState, connected, error, notice, sendAction } = useUnoSocket(roomCode, user);
    const [selectedCardId, setSelectedCardId] = useState(null);

    useEffect(() => {
        setSelectedCardId(null);
    }, [gameState?.turnNumber, gameState?.discardTop?.id]);

    if (!user) {
        navigate("/login");
        return null;
    }

    if (!gameState) {
        return (
            <main className="uno-page">
                <div className="uno-loading">
                    <div className="uno-loader" />
                    <h2>RESTORING YOUR SEAT...</h2>
                    <p>{error || "Connecting you to the live UNO table."}</p>
                </div>
            </main>
        );
    }

    const localPlayer = getPlayer(gameState, user.id);
    const isMyTurn = gameState.currentPlayerId === user.id && gameState.status === "playing";
    const canDraw = gameState.legalActions?.includes(ACTIONS.DRAW_CARD) && isMyTurn;
    const canUno = gameState.legalActions?.includes(ACTIONS.DECLARE_UNO);
    const hand = gameState.hand || [];
    const playableCardIds = gameState.playableCardIds || [];
    const selectedCard = hand.find((card) => card.id === selectedCardId) || null;
    const isColorPickerOpen = gameState.pendingColorChoice?.playerId === user.id;
    const isHostSeat = localPlayer?.seat === 0;

    const playSelected = () => {
        if (!selectedCard || !playableCardIds.includes(selectedCard.id)) return;
        sendAction(ACTIONS.PLAY_CARD, { cardId: selectedCard.id });
        setSelectedCardId(null);
    };

    return (
        <main className="uno-page">
            <div className="uno-game">
                <GameStatus
                    connected={connected}
                    status={gameState.status}
                    activeColor={gameState.activeColor}
                    notice={notice}
                    error={error}
                />

                <section className="uno-main-layout">
                    <div className="uno-table-wrap">
                        <UnoTable
                            gameState={gameState}
                            localPlayerId={user.id}
                            canDraw={canDraw}
                            onDraw={() => sendAction(ACTIONS.DRAW_CARD)}
                            onCallUno={(targetId) => sendAction(ACTIONS.CALL_UNO, { targetId })}
                        />
                    </div>
                    <ScoreBoard players={gameState.players} />
                </section>

                <section className="uno-bottom-panel">
                    {localPlayer && (
                        <>
                            <PlayerHand
                                cards={hand}
                                playableCardIds={playableCardIds}
                                selectedCardId={selectedCardId}
                                onSelect={(card) => {
                                    if (!isMyTurn || !playableCardIds.includes(card.id)) return;
                                    setSelectedCardId((current) => current === card.id ? null : card.id);
                                }}
                            />
                            <ActionPanel
                                isMyTurn={isMyTurn}
                                canDraw={canDraw}
                                canUno={canUno}
                                canCallUno={Boolean(gameState.canCallUno && gameState.pendingUno?.playerId)}
                                hasPendingColor={Boolean(gameState.pendingColorChoice)}
                                connected={connected}
                                selectedCard={selectedCard}
                                onPlay={playSelected}
                                onDraw={() => sendAction(ACTIONS.DRAW_CARD)}
                                onUno={() => sendAction(ACTIONS.DECLARE_UNO)}
                                onCallUno={() => sendAction(ACTIONS.CALL_UNO, { targetId: gameState.pendingUno?.playerId })}
                            />
                        </>
                    )}
                </section>

                <ColorPicker
                    open={isColorPickerOpen}
                    onChoose={(color) => sendAction(ACTIONS.CHOOSE_COLOR, { color })}
                />

                <GameResult
                    result={gameState.result}
                    gameComplete={gameState.status === "game-complete"}
                    canNextRound={isHostSeat}
                    onNextRound={() => sendAction(ACTIONS.NEXT_ROUND)}
                    onLobby={() => navigate("/lobby")}
                />
            </div>
        </main>
    );
}

export default UnoGame;
