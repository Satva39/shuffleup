import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useTwentyNineSocket(roomCode, userId) {
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
      "twenty-nine:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!mountedRef.current) return;
        if (!response?.success) {
          setError(response?.message || "Unable to join Twenty-Nine.");
          return;
        }
        if (response.state) setGameState(response.state);
        setError("");
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
      setConnection("connected");
      setError("");
    };
    const onError = (payload) => {
      if (!mountedRef.current) return;
      setError(payload?.message || "Something went wrong.");
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("twenty-nine:state", onState);
    socket.on("twenty-nine:error", onError);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) joinGame();

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("twenty-nine:state", onState);
      socket.off("twenty-nine:error", onError);
    };
  }, [joinGame, normalizedCode, userId]);

  const request = useCallback((event, payload, fallback) => {
    setError("");
    shuffleSocket.emitSafe(event, payload, (response) => {
      if (!response?.success) {
        setError(response?.message || fallback);
      }
    });
  }, []);

  const submitBid = useCallback(
    (bid) => {
      if (!userId || !normalizedCode) return;
      request(
        "twenty-nine:bid",
        { roomCode: normalizedCode, userId, bid },
        "Unable to submit that bid.",
      );
    },
    [normalizedCode, request, userId],
  );

  const selectTrump = useCallback(
    (suit) => {
      if (!userId || !normalizedCode) return;
      request(
        "twenty-nine:trump",
        { roomCode: normalizedCode, userId, suit },
        "Unable to select trump.",
      );
    },
    [normalizedCode, request, userId],
  );

  const playCard = useCallback(
    (cardId) => {
      if (!userId || !normalizedCode) return;
      request(
        "twenty-nine:play-card",
        { roomCode: normalizedCode, userId, cardId },
        "Unable to play that card.",
      );
    },
    [normalizedCode, request, userId],
  );

  const nextHand = useCallback(() => {
    if (!userId || !normalizedCode) return;
    request(
      "twenty-nine:next-hand",
      { roomCode: normalizedCode, userId },
      "Unable to start the next hand.",
    );
  }, [normalizedCode, request, userId]);

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    submitBid,
    selectTrump,
    playCard,
    nextHand,
  };
}
