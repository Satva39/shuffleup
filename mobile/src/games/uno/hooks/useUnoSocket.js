import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useUnoSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mountedRef = useRef(false);
  const joinedRef = useRef(false);
  const noticeTimerRef = useRef(null);

  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const showNotice = useCallback((message) => {
    if (!message) return;
    setNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 2400);
  }, []);

  const joinGame = useCallback(
    (reconnect = false) => {
      if (!userId || !normalizedCode) return;

      const event =
        reconnect && joinedRef.current ? "uno:reconnect" : "uno:join";
      shuffleSocket.emitSafe(
        event,
        { roomCode: normalizedCode, userId },
        (response) => {
          if (!mountedRef.current) return;
          if (!response?.success) {
            setError(response?.message || "Unable to join UNO.");
            return;
          }
          joinedRef.current = true;
          setError("");
          if (response.state) setGameState(response.state);
          setConnection("connected");
        },
      );
    },
    [normalizedCode, userId],
  );

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
      joinGame(joinedRef.current);
    };

    const onConnectError = () => {
      if (mountedRef.current) setConnection("error");
    };

    const onDisconnect = () => {
      if (mountedRef.current) setConnection("reconnecting");
    };

    const onReconnectAttempt = () => {
      if (mountedRef.current) setConnection("reconnecting");
    };

    const onState = (nextState) => {
      if (!mountedRef.current) return;
      joinedRef.current = true;
      setGameState(nextState);
      setError("");
      setConnection("connected");
    };

    const onPublicState = (publicState) => {
      if (!mountedRef.current) return;
      setGameState((current) =>
        current ? { ...current, ...publicState } : publicState,
      );
    };

    const onError = (payload) => {
      if (!mountedRef.current) return;
      setError(payload?.message || "Action rejected.");
    };

    const onCardPlayed = (payload) => {
      showNotice(
        payload?.playerId === userId
          ? "You played a card."
          : "A player played a card.",
      );
    };

    const onCardDrawn = (payload) => {
      showNotice(
        payload?.playerId === userId
          ? "You drew a card."
          : "A player drew a card.",
      );
    };

    const onColorRequired = () => showNotice("Choose the next color.");
    const onColorChosen = (payload) => {
      showNotice(
        `${String(payload?.color || "").toUpperCase()} is now active.`,
      );
    };
    const onUno = (payload) => {
      showNotice(payload?.playerId === userId ? "UNO!" : "A player is on UNO.");
    };
    const onUnoCalled = () => showNotice("UNO challenge applied.");
    const onRoundStarted = () => showNotice("Next round started.");

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("uno:state", onState);
    socket.on("uno:public-state", onPublicState);
    socket.on("uno:error", onError);
    socket.on("uno:card-played", onCardPlayed);
    socket.on("uno:card-drawn", onCardDrawn);
    socket.on("uno:color-required", onColorRequired);
    socket.on("uno:color-chosen", onColorChosen);
    socket.on("uno:uno", onUno);
    socket.on("uno:uno-called", onUnoCalled);
    socket.on("uno:round-started", onRoundStarted);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) joinGame(joinedRef.current);

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("uno:state", onState);
      socket.off("uno:public-state", onPublicState);
      socket.off("uno:error", onError);
      socket.off("uno:card-played", onCardPlayed);
      socket.off("uno:card-drawn", onCardDrawn);
      socket.off("uno:color-required", onColorRequired);
      socket.off("uno:color-chosen", onColorChosen);
      socket.off("uno:uno", onUno);
      socket.off("uno:uno-called", onUnoCalled);
      socket.off("uno:round-started", onRoundStarted);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, [joinGame, normalizedCode, showNotice, userId]);

  const sendAction = useCallback(
    (action, payload = {}) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        "uno:action",
        { roomCode: normalizedCode, userId, action, payload },
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
    reconnecting: connection === "connecting" || connection === "reconnecting",
    error,
    notice,
    sendAction,
    reconnect: () => joinGame(true),
  };
}
