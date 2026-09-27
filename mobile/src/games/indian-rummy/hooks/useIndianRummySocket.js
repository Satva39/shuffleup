import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useIndianRummySocket(roomCode, userId) {
  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const joinedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    joinedRef.current = false;

    if (!userId || !normalizedCode) return undefined;

    const socket = shuffleSocket.getSocket();
    if (!socket) {
      setConnection("offline");
      setError("Multiplayer connection is unavailable.");
      return undefined;
    }

    const applyState = (state) => {
      if (!state || !mountedRef.current) return;
      setGameState((previous) => ({
        ...(previous || {}),
        ...state,
        you: state.you || previous?.you,
      }));
      setError("");
    };

    const join = () => {
      if (!mountedRef.current) return;
      setConnection("connected");
      const event = joinedRef.current
        ? "indian-rummy:reconnect"
        : "indian-rummy:join";

      shuffleSocket.emitSafe(
        event,
        { roomCode: normalizedCode, userId },
        (response) => {
          if (!mountedRef.current) return;
          if (!response?.success) {
            setError(response?.message || "Unable to join Indian Rummy.");
            return;
          }
          joinedRef.current = true;
          if (response.state) applyState(response.state);
        },
      );
    };

    const onConnect = () => join();
    const onDisconnect = () => {
      setConnection("reconnecting");
    };
    const onConnectError = () => {
      setConnection("error");
    };
    const onState = (state) => applyState(state);
    const onPublicState = (state) => {
      if (!state || !mountedRef.current) return;
      setGameState((previous) => {
        if (!previous) return state;
        return {
          ...previous,
          ...state,
          you: previous.you,
        };
      });
    };
    const onError = (data) => {
      if (!mountedRef.current) return;
      setError(data?.message || "Something went wrong.");
    };
    const onResult = (result) => {
      if (!mountedRef.current || !result) return;
      setGameState((previous) =>
        previous
          ? { ...previous, status: "complete", winner: result.winnerId, result }
          : previous,
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("indian-rummy:state", onState);
    socket.on("indian-rummy:public-state", onPublicState);
    socket.on("indian-rummy:error", onError);
    socket.on("indian-rummy:declare-result", onResult);
    socket.on("indian-rummy:game-complete", onResult);

    setConnection(socket.connected ? "connected" : "connecting");
    if (socket.connected) join();

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("indian-rummy:state", onState);
      socket.off("indian-rummy:public-state", onPublicState);
      socket.off("indian-rummy:error", onError);
      socket.off("indian-rummy:declare-result", onResult);
      socket.off("indian-rummy:game-complete", onResult);
    };
  }, [normalizedCode, userId]);

  const action = useCallback(
    (type, cardId = null) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        "indian-rummy:action",
        {
          roomCode: normalizedCode,
          userId,
          action: type,
          cardId,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Action rejected by the table.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    action,
  };
}
