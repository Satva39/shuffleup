import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import { games } from "../../data/games";
import "./Room.css";

function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(true);

  const game = games.find((item) => item.id === room?.gameId);

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/room/${roomCode}`)}`, {
        replace: true,
      });
      return;
    }

    setJoining(true);
    setError("");

    function handleRoomUpdate(updatedRoom) {
      setRoom(updatedRoom);
      setJoining(false);
    }

    function handleGameStarted(startedRoom) {
      setRoom(startedRoom);
      setJoining(false);

      if (startedRoom.gameId === "kachuful") {
        navigate(`/games/kachuful/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "teen-patti") {
        navigate(`/games/teen-patti/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "indian-rummy") {
        navigate(`/games/indian-rummy/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "mangoose") {
        navigate(`/games/mangoose/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "uno") {
        navigate(`/games/uno/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "jack-thief") {
        navigate(`/games/jack-thief/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "napoleon") {
        navigate(`/games/napoleon/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "bridge") {
        navigate(`/games/bridge/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "spades") {
        navigate(`/games/spades/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "twenty-nine") {
        navigate(`/games/twenty-nine/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "mindi-coat") {
        navigate(`/games/mindi-coat/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "bluff") {
        navigate(`/games/bluff/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "satte-pe-satta") {
        navigate(`/games/satte-pe-satta/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "war") {
        navigate(`/games/war/${startedRoom.code}`);
      }

      if (startedRoom.gameId === "solitaire") {
        navigate(`/games/solitaire/${startedRoom.code}`);
      }
    }

    socket.on("room-updated", handleRoomUpdate);
    socket.on("game-started", handleGameStarted);

    if (!socket.connected) {
      socket.connect();
    }

    /*
     * Important:
     * Ask the server to join the room when this page
     * is opened directly.
     */
    socket.emit(
      "join-room",
      {
        roomCode: roomCode.toUpperCase(),
        user: {
          id: user.id,
          username: user.username,
        },
      },
      (response) => {
        setJoining(false);

        if (!response.success) {
          setError(response.message);
          return;
        }

        setRoom(response.room);
      },
    );

    return () => {
      socket.off("room-updated", handleRoomUpdate);

      socket.off("game-started", handleGameStarted);
    };
  }, [user, roomCode, navigate]);

  function toggleReady() {
    if (!room || !user) return;

    setError("");

    socket.emit(
      "toggle-ready",
      {
        roomCode: room.code,
        userId: user.id,
      },
      (response) => {
        if (!response.success) {
          setError(response.message);
        }
      },
    );
  }

  function startGame() {
    if (!room || !user) return;

    setError("");

    socket.emit(
      "start-game",
      {
        roomCode: room.code,
        userId: user.id,
      },
      (response) => {
        if (!response.success) {
          setError(response.message);
        }
      },
    );
  }

  async function shareRoom() {
    const shareUrl = `${window.location.origin}/room/${encodeURIComponent(roomCode)}`;
    const shareData = {
      title: "Join my ShuffleUp room",
      text: `Join my ShuffleUp room (${roomCode}).`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      window.alert("Room link copied to your clipboard.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      window.prompt("Copy this room link:", shareUrl);
    }
  }

  function leaveRoom() {
    if (room && user) {
      socket.emit("leave-room", {
        roomCode: room.code,
        userId: user.id,
      });
    }

    setRoom(null);
    navigate("/lobby");
  }

  if (joining && !room) {
    return (
      <main className="room-page">
        <div className="room-loading">
          <h2>Joining room...</h2>

          <p>Connecting you to the table.</p>

          <button onClick={() => navigate("/lobby")}>Back to Lobby</button>
        </div>
      </main>
    );
  }

  if (error && !room) {
    return (
      <main className="room-page">
        <div className="room-loading">
          <h2>Unable to join room</h2>

          <p>{error}</p>

          <button onClick={() => navigate("/lobby")}>Back to Lobby</button>
        </div>
      </main>
    );
  }

  if (!room) {
    return null;
  }

  const isHost = room.hostId === user?.id;

  const currentPlayer = room.players.find((player) => player.id === user?.id);

  return (
    <main className="room-page">
      <div className="room-container">
        <header className="room-header">
          <div>
            <p>WAITING ROOM</p>

            <h1>{game?.name || room.gameId}</h1>
          </div>

          <div className="room-code">
            <small>ROOM CODE</small>
            <strong>{room.code}</strong>
          </div>
        </header>

        <section className="room-card">
          <div className="room-status">
            <div>
              <strong>{room.players.length} Players</strong>

              <span>Waiting for everyone to get ready</span>
            </div>

            <span className="status-badge">{room.status}</span>
          </div>

          <div className="players-list">
            {room.players.map((player) => (
              <div className="room-player" key={player.id}>
                <div className="player-info">
                  <div className="player-avatar">
                    {player.username.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{player.username}</strong>

                    {player.id === room.hostId && <small>HOST</small>}
                  </div>
                </div>

                <span
                  className={
                    !player.connected
                      ? "disconnected"
                      : player.ready
                        ? "ready"
                        : "not-ready"
                  }
                >
                  {!player.connected
                    ? "DISCONNECTED"
                    : player.ready
                      ? "READY"
                      : "WAITING"}
                </span>
              </div>
            ))}
          </div>

          {error && <div className="room-error">{error}</div>}

          <div className="room-actions">
            <button className="share-btn" onClick={shareRoom}>
              Share Room
            </button>
            {!isHost && (
              <button className="ready-btn" onClick={toggleReady}>
                {currentPlayer?.ready ? "Not Ready" : "Ready"}
              </button>
            )}

            {isHost && (
              <button className="start-btn" onClick={startGame}>
                Start Game
              </button>
            )}

            <button className="leave-btn" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Room;
