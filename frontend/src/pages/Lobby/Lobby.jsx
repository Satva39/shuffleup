import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { games } from "../../data/games";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import "./Lobby.css";

function Lobby() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [selectedGame, setSelectedGame] =
        useState("");

    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function createRoom() {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!selectedGame) {
            setError("Please select a game.");
            return;
        }

        setError("");
        setLoading(true);

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit(
            "create-room",
            {
                gameId: selectedGame,
                user: {
                    id: user.id,
                    username: user.username,
                },
            },
            (response) => {
                setLoading(false);

                if (!response.success) {
                    setError(response.message);
                    return;
                }

                navigate(`/room/${response.room.code}`);
            }
        );
    }

    function joinRoom() {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!roomCode.trim()) {
            setError("Enter a room code.");
            return;
        }

        setError("");
        setLoading(true);

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit(
            "join-room",
            {
                roomCode: roomCode.trim().toUpperCase(),
                user: {
                    id: user.id,
                    username: user.username,
                },
            },
            (response) => {
                setLoading(false);

                if (!response.success) {
                    setError(response.message);
                    return;
                }

                navigate(`/room/${response.room.code}`);
            }
        );
    }

    return (
        <main className="lobby-page">
            <div className="lobby-container">
                <div className="lobby-header">
                    <p>SHUFFLEUP MULTIPLAYER</p>

                    <h1>Choose Your Table</h1>

                    <span>
                        Create a room or join your friends.
                    </span>
                </div>

                <div className="lobby-layout">
                    <section className="create-room-card">
                        <div className="card-number">01</div>

                        <h2>Create a Room</h2>

                        <p>
                            Choose a game and invite your friends
                            with a room code.
                        </p>

                        <div className="game-selection">
                            {games.map((game) => (
                                <button
                                    key={game.id}
                                    className={
                                        selectedGame === game.id
                                            ? "selected"
                                            : ""
                                    }
                                    onClick={() =>
                                        setSelectedGame(game.id)
                                    }
                                >
                                    <strong>{game.name}</strong>
                                    <small>{game.players}</small>
                                </button>
                            ))}
                        </div>

                        <button
                            className="lobby-primary-btn"
                            onClick={createRoom}
                            disabled={loading}
                        >
                            {loading
                                ? "Creating..."
                                : "Create Room"}
                        </button>
                    </section>

                    <section className="join-room-card">
                        <div className="card-number">02</div>

                        <h2>Join a Room</h2>

                        <p>
                            Have a room code? Enter it below to
                            join your friends.
                        </p>

                        <input
                            type="text"
                            placeholder="ENTER ROOM CODE"
                            value={roomCode}
                            maxLength={6}
                            onChange={(event) =>
                                setRoomCode(
                                    event.target.value.toUpperCase()
                                )
                            }
                        />

                        <button
                            className="lobby-secondary-btn"
                            onClick={joinRoom}
                            disabled={loading}
                        >
                            {loading
                                ? "Joining..."
                                : "Join Room"}
                        </button>
                    </section>
                </div>

                {error && (
                    <div className="lobby-error">
                        {error}
                    </div>
                )}
            </div>
        </main>
    );
}

export default Lobby;