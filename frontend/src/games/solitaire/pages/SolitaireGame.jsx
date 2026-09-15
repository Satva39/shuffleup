import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useSolitaireSocket } from "../hooks/useSolitaireSocket";
import SolitaireTable from "../components/SolitaireTable";
import "../styles/solitaire.css";

export default function SolitaireGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        state,
        error,
        connected,
        sendMove,
        drawStock,
    } = useSolitaireSocket({
        roomCode,
        user,
    });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [navigate, user]);

    if (!user) return null;

    if (!state) {
        return (
            <main className="solitaire-page">
                <div className="solitaire-loading">
                    <span className="solitaire-eyebrow">SHUFFLEUP · GAME 15</span>
                    <h1>Joining Solitaire…</h1>
                    <p>{error || "Preparing your private board."}</p>
                </div>
            </main>
        );
    }

    return (
        <SolitaireTable
            state={state}
            error={error}
            connected={connected}
            onMove={sendMove}
            onDraw={drawStock}
            onLobby={() => navigate("/lobby")}
        />
    );
}
