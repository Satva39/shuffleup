import { useCallback, useEffect, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useTeenPattiSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );

  const normalizedRoomCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  useEffect(() => {
    if (!userId || !normalizedRoomCode) return undefined;

    const socket = shuffleSocket.getSocket();
    if (!socket) {
      setConnection("offline");
      setError("Multiplayer connection is unavailable.");
      return undefined;
    }

    let active = true;

    const applyPrivateState = (state) => {
      if (!active || !state) return;
      setGameState(state);
      setError("");
    };

    const joinGame = () => {
      if (!active) return;
      setConnection("connected");
      setError("");

      socket.emit(
        "teen-patti:join",
        { roomCode: normalizedRoomCode, userId },
        (response) => {
          if (!active) return;
          if (!response?.success) {
            setError(response?.message || "Unable to join Teen Patti.");
            return;
          }
          applyPrivateState(response.state);
        },
      );
    };

    const handleConnect = () => joinGame();
    const handleDisconnect = () => setConnection("reconnecting");
    const handleConnectError = () => setConnection("error");
    const handleState = (state) => applyPrivateState(state);

    const handlePublicState = (publicState) => {
      if (!active || !publicState) return;
      setGameState((current) => ({
        ...publicState,
        cards: current?.cards || [],
        legalActions: current?.legalActions || [],
      }));
    };

    const handleRoundComplete = (roundResult) => {
      if (!active) return;
      setGameState((current) =>
        current ? { ...current, lastRoundResult: roundResult } : current,
      );
    };

    const handleGameComplete = (result) => {
      if (!active) return;
      setGameState((current) =>
        current
          ? {
              ...current,
              status: "complete",
              result,
              winner: result?.winnerId || current.winner,
            }
          : current,
      );
    };

    const handleError = (payload) => {
      setError(
        typeof payload === "string"
          ? payload
          : payload?.message || "Teen Patti error.",
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("teen-patti:state", handleState);
    socket.on("teen-patti:public-state", handlePublicState);
    socket.on("teen-patti:round-complete", handleRoundComplete);
    socket.on("teen-patti:game-complete", handleGameComplete);
    socket.on("teen-patti:error", handleError);

    if (socket.connected) {
      joinGame();
    } else {
      setConnection("connecting");
      socket.connect();
    }

    return () => {
      active = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("teen-patti:state", handleState);
      socket.off("teen-patti:public-state", handlePublicState);
      socket.off("teen-patti:round-complete", handleRoundComplete);
      socket.off("teen-patti:game-complete", handleGameComplete);
      socket.off("teen-patti:error", handleError);
    };
  }, [normalizedRoomCode, userId]);

  const sendAction = useCallback(
    (action) => {
      if (!userId || !normalizedRoomCode) return;

      setError("");
      shuffleSocket.emitSafe(
        "teen-patti:action",
        {
          roomCode: normalizedRoomCode,
          userId,
          action,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Action failed.");
          }
        },
      );
    },
    [normalizedRoomCode, userId],
  );

  const reconnectGame = useCallback(() => {
    const socket = shuffleSocket.getSocket();
    if (!socket?.connected || !userId || !normalizedRoomCode) return;

    socket.emit(
      "teen-patti:reconnect",
      { roomCode: normalizedRoomCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to restore the game.");
          return;
        }
        if (response.state) setGameState(response.state);
        setConnection("connected");
      },
    );
  }, [normalizedRoomCode, userId]);

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    sendAction,
    reconnectGame,
  };
}
