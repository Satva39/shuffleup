import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useSattePeSattaSocket } from "../hooks/useSattePeSattaSocket";
import SattePeSattaTable from "../components/SattePeSattaTable";
import "../styles/satte-pe-satta.css";

export default function SattePeSattaGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, error, connected, playCard, pass } = useSattePeSattaSocket({ roomCode, user });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!state) {
        return (
            <main className="sps-page">
                <div className="sps-loading">
                    <span className="sps-eyebrow">SHUFFLEUP · CLASSIC</span>
                    <h1>Joining Satte Pe Satta…</h1>
                    <p>{error || "Connecting you to the table."}</p>
                </div>
            </main>
        );
    }

    return (
        <SattePeSattaTable
            state={state}
            user={user}
            error={error}
            connected={connected}
            playCard={playCard}
            pass={pass}
            onLobby={() => navigate("/lobby")}
        />
    );
}
