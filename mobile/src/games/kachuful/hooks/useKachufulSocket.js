import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useKachufulSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const mountedRef = useRef(false);

  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const joinGame = useCallback(() => {
    if (!userId || !normalizedCode) return;

    shuffleSocket.emitSafe(
      "kachuful:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!mountedRef.current) return;
        if (!response?.success) {
          setError(response?.message || "Unable to join Kachuful.");
        }
      },
    );
  }, [normalizedCode, userId]);

  useEffect(() => {
    mountedRef.current = true;
    const socket = shuffleSocket.getSocket();

    if (!socket || !userId || !normalizedCode) {
      setConnection("offline");
      return () => {
        mountedRef.current = false;
      };
    }

    const onConnect = () => {
      setConnection("connected");
      setError("");
      joinGame();
    };

    const onConnectError = () => {
      setConnection("error");
    };

    const onDisconnect = () => {
      setConnection("reconnecting");
    };

    const onReconnectAttempt = () => {
      setConnection("reconnecting");
    };

    const onState = (nextState) => {
      if (!mountedRef.current) return;
      setGameState(nextState);
      setError("");
      setConnection("connected");
    };

    const onError = (payload) => {
      if (!mountedRef.current) return;
      setError(payload?.message || "Something went wrong.");
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("kachuful:state", onState);
    socket.on("kachuful:error", onError);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) joinGame();

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("kachuful:state", onState);
      socket.off("kachuful:error", onError);
    };
  }, [joinGame, normalizedCode, userId]);

  const submitBid = useCallback(
    (bid) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        "kachuful:bid",
        { roomCode: normalizedCode, userId, bid },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Unable to submit bid.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  const playCard = useCallback(
    (cardId) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        "kachuful:play-card",
        { roomCode: normalizedCode, userId, cardId },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Unable to play that card.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  const nextRound = useCallback(() => {
    if (!userId || !normalizedCode) return;
    setError("");
    shuffleSocket.emitSafe(
      "kachuful:next-round",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to continue the game.");
        }
      },
    );
  }, [normalizedCode, userId]);

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    submitBid,
    playCard,
    nextRound,
  };
}
