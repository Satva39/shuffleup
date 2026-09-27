import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useBridgeSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const mountedRef = useRef(false);
  const code = String(roomCode || "")
    .trim()
    .toUpperCase();

  const join = useCallback(() => {
    if (!userId || !code) return;
    shuffleSocket.emitSafe("bridge:join", { roomCode: code, userId }, (res) => {
      if (!mountedRef.current) return;
      if (!res?.success) setError(res?.message || "Unable to join Bridge.");
      else if (res.state) setGameState(res.state);
    });
  }, [code, userId]);

  useEffect(() => {
    mountedRef.current = true;
    const socket = shuffleSocket.getSocket();
    if (!socket || !userId || !code) {
      setConnection("offline");
      return () => {
        mountedRef.current = false;
      };
    }

    const onConnect = () => {
      setConnection("connected");
      setError("");
      join();
    };
    const onConnectError = () => setConnection("error");
    const onDisconnect = () => setConnection("reconnecting");
    const onReconnectAttempt = () => setConnection("reconnecting");
    const onReconnect = () => {
      setConnection("connected");
      shuffleSocket.emitSafe(
        "bridge:reconnect",
        { roomCode: code, userId },
        (res) => {
          if (!mountedRef.current) return;
          if (!res?.success)
            setError(res?.message || "Unable to restore Bridge.");
          else if (res.state) setGameState(res.state);
        },
      );
    };
    const onState = (state) => {
      if (mountedRef.current) {
        setGameState(state);
        setConnection("connected");
        setError("");
      }
    };
    const onError = (payload) => {
      if (mountedRef.current)
        setError(payload?.message || "Bridge action failed.");
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("bridge:state", onState);
    socket.on("bridge:error", onError);
    socket.io?.on("reconnect", onReconnect);
    if (socket.connected) {
      setConnection("connected");
      join();
    } else setConnection("connecting");

    return () => {
      mountedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("bridge:state", onState);
      socket.off("bridge:error", onError);
      socket.io?.off("reconnect", onReconnect);
    };
  }, [code, join, userId]);

  const submit = useCallback(
    (event, payload = {}) => {
      if (!userId || !code) return;
      setError("");
      shuffleSocket.emitSafe(
        event,
        { roomCode: code, userId, ...payload },
        (res) => {
          if (!res?.success) setError(res?.message || "Bridge action failed.");
        },
      );
    },
    [code, userId],
  );

  return {
    gameState,
    error,
    connection,
    connected: connection === "connected",
    reconnecting: ["connecting", "reconnecting"].includes(connection),
    submit,
  };
}
