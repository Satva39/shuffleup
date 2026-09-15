import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useWarSocket } from "../hooks/useWarSocket";
import WarTable from "../components/WarTable";
import "../styles/war.css";

export default function WarGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, error, connected } = useWarSocket({ roomCode, user });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!state) {
        return (
            <main className="war-page">
                <div className="war-loading">
                    <span className="war-eyebrow">SHUFFLEUP · GAME 14</span>
                    <h1>Joining War…</h1>
                    <p>{error || "Connecting to the table."}</p>
                </div>
            </main>
        );
    }

    return (
        <WarTable
            state={state}
            user={user}
            error={error}
            connected={connected}
            onLobby={() => navigate("/lobby")}
        />
    );
}
