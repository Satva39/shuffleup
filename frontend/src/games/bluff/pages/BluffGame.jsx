import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useBluffSocket } from "../hooks/useBluffSocket";
import BluffTable from "../components/BluffTable";
import "../styles/bluff.css";

export default function BluffGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, error, connected, playCards, challenge, expireChallenge } = useBluffSocket({ roomCode, user });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!state) {
        return (
            <main className="bluff-page">
                <div className="bluff-loading">
                    <div className="loading-chip">BLUFF / CHEAT</div>
                    <h1>Joining the table…</h1>
                    <p>{error || "Connecting to ShuffleUp."}</p>
                </div>
            </main>
        );
    }

    return (
        <BluffTable
            state={state}
            user={user}
            error={error}
            connected={connected}
            playCards={playCards}
            challenge={challenge}
            expireChallenge={expireChallenge}
        />
    );
}
