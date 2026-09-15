import { useAuth } from "../../../context/AuthContext";
import { useParams } from "react-router-dom";
import BridgeTable from "../components/BridgeTable";
import { useBridgeSocket } from "../hooks/useBridgeSocket";
import "../styles/bridge.css";

export default function BridgeGame() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const { state, error, connected, submit } = useBridgeSocket(roomCode, user);

    if (!user) return <div className="bridge-loading">Please log in to play Bridge.</div>;
    if (!state) return <div className="bridge-loading"><div className="bridge-spinner" /><h2>Joining Bridge table…</h2><p>{connected ? "Synchronizing your private hand." : "Connecting to the game server."}</p>{error && <strong>{error}</strong>}</div>;

    return (
        <BridgeTable
            state={state}
            error={error}
            onBid={(action) => submit("bridge:bid", { action })}
            onCard={(card, sourceSeat) => submit("bridge:play-card", { cardId: card.id, sourceSeat })}
            onNextDeal={() => submit("bridge:next-deal")}
        />
    );
}
