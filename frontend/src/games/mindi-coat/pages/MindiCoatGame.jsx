import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useMindiCoatSocket } from "../hooks/useMindiCoatSocket";
import MindiCoatTable from "../components/MindiCoatTable";
import "../styles/mindi-coat.css";

export default function MindiCoatGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, error, selectTrump, openHukum, playCard, nextHand } = useMindiCoatSocket({
        roomCode,
        user,
    });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;
    if (!state) {
        return (
            <main className="mindi-page">
                <div className="mindi-loading">
                    Joining Mindi Coat…
                    {error && <p>{error}</p>}
                </div>
            </main>
        );
    }

    const returnToLobby = () => navigate(`/room/${roomCode}`);

    return (
        <MindiCoatTable
            state={state}
            user={user}
            error={error}
            selectTrump={selectTrump}
            openHukum={openHukum}
            playCard={playCard}
            nextHand={nextHand}
            onReturnToLobby={returnToLobby}
        />
    );
}
