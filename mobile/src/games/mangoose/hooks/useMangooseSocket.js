import { useCallback, useEffect, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useMangooseSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const joinGame = useCallback(() => {
    if (!userId || !normalizedCode) return;

    shuffleSocket.emitSafe(
      "mangoose:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join Mangoose.");
          return;
        }

        setError("");
        setGameState(response.state || null);
      },
    );
  }, [normalizedCode, userId]);

  const reconnect = useCallback(() => {
    if (!userId || !normalizedCode) return;

    shuffleSocket.emitSafe(
      "mangoose:reconnect",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          joinGame();
          return;
        }

        setError("");
        setGameState(response.state || null);
      },
    );
  }, [joinGame, normalizedCode, userId]);

  useEffect(() => {
    if (!userId || !normalizedCode) return undefined;

    const socket = shuffleSocket.getSocket();
    if (!socket) {
      setConnection("offline");
      return undefined;
    }

    const handleConnect = () => {
      setConnection("connected");
      if (gameState) reconnect();
      else joinGame();
    };

    const handleDisconnect = () => setConnection("reconnecting");
    const handleConnectError = () => setConnection("error");
    const handleReconnectAttempt = () => setConnection("reconnecting");

    const handleState = (state) => {
      setGameState(state || null);
      setError("");
    };

    const handlePublicState = (publicState) => {
      setGameState((current) =>
        current ? { ...current, ...publicState } : current,
      );
    };

    const handleError = ({ message } = {}) => {
      setError(message || "Something went wrong.");
    };

    const handleNotice = ({ message } = {}) => {
      if (message) setNotice({ id: Date.now(), message });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("mangoose:state", handleState);
    socket.on("mangoose:public-state", handlePublicState);
    socket.on("mangoose:error", handleError);
    socket.on("mangoose:notice", handleNotice);

    if (socket.connected) {
      handleConnect();
    } else {
      setConnection("connecting");
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("mangoose:state", handleState);
      socket.off("mangoose:public-state", handlePublicState);
      socket.off("mangoose:error", handleError);
      socket.off("mangoose:notice", handleNotice);
    };
  }, [joinGame, reconnect, normalizedCode, userId]);

  const sendAction = useCallback(
    (action, target = null) => {
      if (!userId || !normalizedCode) return;

      setError("");
      shuffleSocket.emitSafe(
        "mangoose:action",
        {
          roomCode: normalizedCode,
          userId,
          action,
          target,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Action rejected.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  return {
    gameState,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    error,
    notice,
    sendAction,
    reconnect,
  };
}
