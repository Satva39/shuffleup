import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useBridgeSocket(roomCode, user) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    const requestState = useCallback(() => {
        if (!roomCode || !user) return;
        socket.emit("bridge:state", { roomCode, userId: user.id }, (response) => {
            if (response?.success) setState(response.state);
        });
    }, [roomCode, user]);

    useEffect(() => {
        if (!user || !roomCode) return undefined;
        setError("");
        if (!socket.connected) socket.connect();

        const onConnect = () => {
            setConnected(true);
            socket.emit("bridge:join", { roomCode, userId: user.id }, (response) => {
                if (!response?.success) setError(response?.message || "Unable to join Bridge.");
                else setState(response.state);
            });
        };
        const onDisconnect = () => setConnected(false);
        const onState = (nextState) => setState(nextState);
        const onError = (payload) => setError(payload?.message || "Bridge action failed.");
        const onReconnect = () => {
            socket.emit("bridge:reconnect", { roomCode, userId: user.id }, (response) => {
                if (!response?.success) setError(response?.message || "Unable to reconnect to Bridge.");
                else setState(response.state);
            });
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("bridge:state", onState);
        socket.on("bridge:error", onError);
        socket.io.on("reconnect", onReconnect);

        if (socket.connected) onConnect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("bridge:state", onState);
            socket.off("bridge:error", onError);
            socket.io.off("reconnect", onReconnect);
        };
    }, [roomCode, user]);

    const submit = useCallback((event, payload = {}) => {
        setError("");
        return new Promise((resolve) => {
            socket.emit(event, { roomCode, userId: user.id, ...payload }, (response) => {
                if (!response?.success) setError(response?.message || "Bridge action failed.");
                resolve(response);
            });
        });
    }, [roomCode, user]);

    return {
        state,
        error,
        connected,
        submit,
        refresh: requestState,
    };
}
