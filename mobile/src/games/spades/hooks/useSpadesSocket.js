import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useSpadesSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const mountedRef = useRef(true);
  const stateRef = useRef(null);

  const normalizedRoomCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const applyState = useCallback((state) => {
    if (!mountedRef.current || !state) return;
    stateRef.current = state;
    setGameState(state);
    setError(null);
  }, []);

  const emitRequest = useCallback(
    (event, payload = {}) =>
      new Promise((resolve) => {
        const socket = shuffleSocket.getSocket();
        if (!socket) {
          const response = {
            success: false,
            message: "Socket is unavailable.",
          };
          if (mountedRef.current) setError(response.message);
          resolve(response);
          return;
        }

        socket.emit(
          event,
          {
            roomCode: normalizedRoomCode,
            userId,
            ...payload,
          },
          (response) => {
            if (!response?.success && mountedRef.current) {
              setError(response?.message || "The server rejected that action.");
            }
            if (response?.success && response.state) {
              applyState(response.state);
            }
            resolve(response);
          },
        );
      }),
    [applyState, normalizedRoomCode, userId],
  );

  const joinGame = useCallback(() => {
    if (!normalizedRoomCode || !userId) return;
    emitRequest("spades:join");
  }, [emitRequest, normalizedRoomCode, userId]);

  const reconnectGame = useCallback(() => {
    if (!normalizedRoomCode || !userId) return;
    emitRequest("spades:reconnect");
  }, [emitRequest, normalizedRoomCode, userId]);

  useEffect(() => {
    mountedRef.current = true;
    const socket = shuffleSocket.getSocket();
    if (!socket || !normalizedRoomCode || !userId) {
      setConnection("offline");
      setConnected(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const onConnect = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setConnection("connected");
      setReconnecting(false);

      if (stateRef.current) reconnectGame();
      else joinGame();
    };

    const onDisconnect = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      setConnection("reconnecting");
      setReconnecting(true);
    };

    const onConnectError = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      setConnection("error");
      setReconnecting(true);
    };

    const onState = (state) => applyState(state);
    const onError = (payload) => {
      if (!mountedRef.current) return;
      setError(payload?.message || "Spades action failed.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("spades:state", onState);
    socket.on("spades:error", onError);

    if (socket.connected) onConnect();
    else {
      setConnection("connecting");
      setConnected(false);
      socket.connect?.();
    }

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("spades:state", onState);
      socket.off("spades:error", onError);
    };
  }, [applyState, joinGame, reconnectGame, normalizedRoomCode, userId]);

  const refreshState = useCallback(() => {
    return emitRequest("spades:state");
  }, [emitRequest]);

  const submitBid = useCallback(
    (bid) => emitRequest("spades:bid", { bid }),
    [emitRequest],
  );

  const playCard = useCallback(
    (cardId) => emitRequest("spades:play-card", { cardId }),
    [emitRequest],
  );

  const nextHand = useCallback(
    () => emitRequest("spades:next-hand"),
    [emitRequest],
  );

  return {
    gameState,
    error,
    connection,
    connected,
    reconnecting,
    submitBid,
    playCard,
    nextHand,
    refreshState,
  };
}
