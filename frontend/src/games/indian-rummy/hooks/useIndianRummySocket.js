import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useIndianRummySocket(roomCode, user) {
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);
    const [reconnecting, setReconnecting] = useState(false);

    useEffect(() => {
        if (!user?.id || !roomCode) return;

        const join = () => {
            setConnected(true);
            setReconnecting(false);
            socket.emit("indian-rummy:join", {
                roomCode: roomCode.toUpperCase(),
                userId: user.id,
            }, (response) => {
                if (!response?.success) setError(response?.message || "Unable to join Indian Rummy.");
            });
        };

        const onDisconnect = () => {
            setConnected(false);
            setReconnecting(true);
        };

        const onState = (state) => {
            setGameState(state);
            setError("");
            setReconnecting(false);
        };

        const onError = (data) => setError(data?.message || "Something went wrong.");

        socket.on("connect", join);
        socket.on("disconnect", onDisconnect);
        socket.on("indian-rummy:state", onState);
        socket.on("indian-rummy:error", onError);

        if (!socket.connected) socket.connect(); else join();

        return () => {
            socket.off("connect", join);
            socket.off("disconnect", onDisconnect);
            socket.off("indian-rummy:state", onState);
            socket.off("indian-rummy:error", onError);
        };
    }, [roomCode, user]);

    const action = useCallback((type, cardId = null) => {
        if (!user?.id || !roomCode) return;
        setError("");
        socket.emit("indian-rummy:action", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            action: type,
            cardId,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Action rejected.");
        });
    }, [roomCode, user]);

    return { gameState, error, connected, reconnecting, action };
}
