import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useMindiCoatSocket(roomCode, userId) {
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
      "mindi-coat:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!mountedRef.current) return;
        if (!response?.success) {
          setError(response?.message || "Unable to join Mindi Coat.");
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
    const onConnectError = () => setConnection("error");
    const onDisconnect = () => setConnection("reconnecting");
    const onReconnectAttempt = () => setConnection("reconnecting");
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
    socket.on("mindi-coat:state", onState);
    socket.on("mindi-coat:error", onError);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) joinGame();

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("mindi-coat:state", onState);
      socket.off("mindi-coat:error", onError);
    };
  }, [joinGame, normalizedCode, userId]);

  const selectTrump = useCallback(
    (cardId) => {
      setError("");
      shuffleSocket.emitSafe(
        "mindi-coat:trump-select",
        { roomCode: normalizedCode, userId, cardId },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Unable to select Hukum.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  const openHukum = useCallback(() => {
    setError("");
    shuffleSocket.emitSafe(
      "mindi-coat:open-hukum",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to open Hukum.");
        }
      },
    );
  }, [normalizedCode, userId]);

  const playCard = useCallback(
    (cardId) => {
      setError("");
      shuffleSocket.emitSafe(
        "mindi-coat:play-card",
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

  const nextHand = useCallback(() => {
    setError("");
    shuffleSocket.emitSafe(
      "mindi-coat:next-hand",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to start the next hand.");
        }
      },
    );
  }, [normalizedCode, userId]);

  const refreshState = useCallback(() => {
    if (!userId || !normalizedCode) return;
    shuffleSocket.emitSafe(
      "mindi-coat:state",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (response?.success) setGameState(response.state);
        else setError(response?.message || "Unable to refresh Mindi Coat.");
      },
    );
  }, [normalizedCode, userId]);

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    selectTrump,
    openHukum,
    playCard,
    nextHand,
    refreshState,
  };
}
