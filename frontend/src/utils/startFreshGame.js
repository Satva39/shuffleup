import { socket } from "../services/socket";

/** Leave the current server session and route to the existing setup flow. */
export function startFreshGame(
  gameId,
  roomCode,
  navigate,
  { confirm = true } = {},
) {
  if (!gameId || typeof navigate !== "function") return false;
  if (
    confirm &&
    typeof window !== "undefined" &&
    !window.confirm("Leave this table and set up a fresh game?")
  )
    return false;

  if (roomCode && socket.connected) {
    try {
      socket.emit("leave-room", { roomCode });
    } catch {
      // Navigation must remain possible if the socket has already dropped.
    }
  }

  const lastMode =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("shuffleup:last-game-mode")
      : null;
  const lastGameId =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("shuffleup:last-game-id")
      : null;
  if (lastMode === "bots" && lastGameId === gameId && gameId !== "solitaire") {
    navigate(`/play-with-bots?game=${encodeURIComponent(gameId)}`);
  } else {
    navigate(`/lobby?game=${encodeURIComponent(gameId)}`);
  }
  return true;
}
