import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTwentyNineSocket } from "../hooks/useTwentyNineSocket";
import TwentyNineTable from "../components/TwentyNineTable";
import "../styles/twenty-nine.css";

export default function TwentyNineGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useTwentyNineSocket({ roomCode, user });

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    if (!user) return null;

    if (!socket.state) {
        return (
            <main className="twenty-nine-page">
                <div className="twenty-nine-loading">
                    <span className="twenty-nine-brand">SHUFFLEUP</span>
                    <h1>Taking a seat…</h1>
                    {socket.error && <p className="twenty-nine-error">{socket.error}</p>}
                </div>
            </main>
        );
    }

    return (
        <TwentyNineTable
            state={socket.state}
            error={socket.error}
            connected={socket.connected}
            submitBid={socket.submitBid}
            selectTrump={socket.selectTrump}
            playCard={socket.playCard}
            nextHand={socket.nextHand}
            user={user}
        />
    );
}
