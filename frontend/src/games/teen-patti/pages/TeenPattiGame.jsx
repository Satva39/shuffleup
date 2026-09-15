import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useTeenPattiSocket } from "../hooks/useTeenPattiSocket";

import TeenPattiTable from "../components/TeenPattiTable";

function TeenPattiGame() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        gameState,
        error,
        connected,
        sendAction,
    } = useTeenPattiSocket(roomCode, user?.id);

    if (!user) {
        navigate("/login");
        return null;
    }

    function handlePlayAgain() {
        navigate("/lobby");
    }

    function handleLobby() {
        navigate("/lobby");
    }

    return (
        <TeenPattiTable
            gameState={gameState}
            error={error}
            connected={connected}
            user={user}
            onAction={sendAction}
            onPlayAgain={handlePlayAgain}
            onLobby={handleLobby}
        />
    );
}

export default TeenPattiGame;