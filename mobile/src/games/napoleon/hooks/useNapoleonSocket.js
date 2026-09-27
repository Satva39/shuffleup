import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useNapoleonSocket(roomCode, userId) {
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
      "napoleon:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!mountedRef.current) return;
        if (!response?.success) {
          setError(response?.message || "Unable to join Napoleon.");
        }
      },
    );
  }, [normalizedCode, userId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId || !normalizedCode || !shuffleSocket.getSocket()) {
      setConnection("offline");
      return () => {
        mountedRef.current = false;
      };
    }

    const socket = shuffleSocket.getSocket();

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
    socket.on("napoleon:state", onState);
    socket.on("napoleon:error", onError);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) joinGame();

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("napoleon:state", onState);
      socket.off("napoleon:error", onError);
    };
  }, [joinGame, normalizedCode, userId]);

  const emitAction = useCallback(
    (event, payload, fallback) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        event,
        { roomCode: normalizedCode, userId, ...payload },
        (response) => {
          if (!response?.success) {
            setError(response?.message || fallback);
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  const submitBid = useCallback(
    (bid) => emitAction("napoleon:bid", { bid }, "Unable to submit bid."),
    [emitAction],
  );

  const callPartner = useCallback(
    (card) =>
      emitAction(
        "napoleon:call-partner",
        { card },
        "Unable to call the partner card.",
      ),
    [emitAction],
  );

  const discard = useCallback(
    (cardIds) =>
      emitAction("napoleon:discard", { cardIds }, "Unable to discard cards."),
    [emitAction],
  );

  const playCard = useCallback(
    (cardId) =>
      emitAction("napoleon:play-card", { cardId }, "Unable to play that card."),
    [emitAction],
  );

  const nextRound = useCallback(
    () =>
      emitAction("napoleon:next-round", {}, "Unable to start the next round."),
    [emitAction],
  );

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    submitBid,
    callPartner,
    discard,
    playCard,
    nextRound,
  };
}
