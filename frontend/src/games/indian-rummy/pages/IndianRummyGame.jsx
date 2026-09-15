import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useIndianRummySocket } from "../hooks/useIndianRummySocket";
import RummyTable from "../components/RummyTable";
import GameStatus from "../components/GameStatus";
import GameResult from "../components/GameResult";
import "../styles/indianRummy.css";

export default function IndianRummyGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { gameState, error, connected, reconnecting, action } = useIndianRummySocket(roomCode, user);
    const [selectedIds, setSelectedIds] = useState([]);
    const [localCards, setLocalCards] = useState([]);

    useEffect(() => {
        if (gameState?.you?.cards) {
            setLocalCards(gameState.you.cards);
            setSelectedIds((ids) => ids.filter((id) => gameState.you.cards.some((card) => card.id === id)));
        }
    }, [gameState]);


    if (!user) {
        navigate("/login");
        return null;
    }

    if (!gameState) {
        return <main className="rummy-loading"><h2>{reconnecting ? "Reconnecting…" : "Joining table…"}</h2><p>Restoring your Indian Rummy seat.</p></main>;
    }

    if (gameState.status === "complete") {
        return <main className="indian-rummy-page"><GameResult result={gameState.result} onLobby={() => navigate("/lobby")} /></main>;
    }

    const moveSelected = (delta) => {
        if (selectedIds.length !== 1) return;
        const selected = selectedIds[0];
        setLocalCards((previous) => {
            const nextCards = [...(previous.length ? previous : gameState.you.cards)];
            const index = nextCards.findIndex((card) => card.id === selected);
            const nextIndex = index + delta;
            if (index < 0 || nextIndex < 0 || nextIndex >= nextCards.length) return nextCards;
            [nextCards[index], nextCards[nextIndex]] = [nextCards[nextIndex], nextCards[index]];
            return nextCards;
        });
    };

    return <main className="indian-rummy-page"><GameStatus connected={connected} error={error} /><RummyTable gameState={gameState} userId={user.id} cards={localCards.length ? localCards : gameState.you.cards} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onMove={moveSelected} onDrawClosed={() => action("draw-closed")} onDrawDiscard={() => action("draw-discard")} onDiscard={() => selectedIds.length === 1 && action("discard", selectedIds[0])} onDeclare={() => selectedIds.length === 1 && action("declare", selectedIds[0])} /></main>;
}
