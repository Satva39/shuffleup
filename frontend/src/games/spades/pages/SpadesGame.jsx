import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useSpadesSocket } from "../hooks/useSpadesSocket";
import SpadesTable from "../components/SpadesTable";
import "../styles/spades.css";

export default function SpadesGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, error, submitBid, playCard, nextHand } = useSpadesSocket({ roomCode, user });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!state) {
        return (
            <main className="spades-page">
                <div className="spades-loading">Joining Spades…</div>
                {error && <div className="spades-error">{error}</div>}
            </main>
        );
    }

    return (
        <SpadesTable
            state={state}
            user={user}
            error={error}
            submitBid={submitBid}
            playCard={playCard}
            nextHand={nextHand}
        />
    );
}
