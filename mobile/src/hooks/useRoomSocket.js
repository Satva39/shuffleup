import { useCallback, useEffect, useState } from "react";
import { shuffleSocket } from "../services/socket";

export function useRoomSocket(roomCode) {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );

  useEffect(() => {
    const socket = shuffleSocket.getSocket();
    if (!socket || !roomCode) {
      setStatus("offline");
      return undefined;
    }

    const normalizedCode = String(roomCode).trim().toUpperCase();

    const handleConnect = () => {
      setStatus("connected");
      socket.emit("join-room", { roomCode: normalizedCode }, (result) => {
        if (result?.success) setRoom(result.room);
      });
    };

    const handleConnectError = () => setStatus("error");
    const handleDisconnect = () => setStatus("reconnecting");
    const handleReconnectAttempt = () => setStatus("reconnecting");
    const handleRoomUpdated = (nextRoom) => setRoom(nextRoom);

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("room-updated", handleRoomUpdated);

    setStatus(socket.connected ? "connected" : "connecting");

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("room-updated", handleRoomUpdated);
    };
  }, [roomCode]);

  const request = useCallback((event, payload) => {
    return new Promise((resolve) => {
      shuffleSocket.emitSafe(event, payload, (result) => resolve(result));
    });
  }, []);

  return {
    room,
    setRoom,
    status,
    connected: status === "connected",
    request,
  };
}
