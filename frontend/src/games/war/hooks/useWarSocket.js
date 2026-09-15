import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useWarSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    const normalizedRoom = roomCode?.toUpperCase();

    const join = useCallback(() => {
        if (!normalizedRoom || !user?.id) return;
        setError("");
        socket.emit("war:join", { roomCode: normalizedRoom, userId: user.id }, (response) => {
            if (!response?.success) {
                setError(response?.message || "Unable to join War.");
                return;
            }
            setState(response.state);
        });
    }, [normalizedRoom, user?.id]);

    useEffect(() => {
        if (!normalizedRoom || !user?.id) return undefined;

        const onState = (next) => setState(next);
        const onError = ({ message }) => setError(message || "War action rejected.");
        const onConnect = () => {
            setConnected(true);
            socket.emit("war:reconnect", { roomCode: normalizedRoom, userId: user.id }, (response) => {
                if (response?.success) setState(response.state);
                else join();
            });
        };
        const onDisconnect = () => setConnected(false);

        socket.on("war:state", onState);
        socket.on("war:error", onError);
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (!socket.connected) socket.connect();
        else join();

        return () => {
            socket.off("war:state", onState);
            socket.off("war:error", onError);
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [normalizedRoom, user?.id, join]);

    const startBattle = useCallback(() => {
        if (!normalizedRoom || !user?.id) return;
        setError("");
        socket.emit("war:start-battle", { roomCode: normalizedRoom, userId: user.id }, (response) => {
            if (!response?.success) setError(response?.message || "Battle could not be started.");
            else setState(response.state);
        });
    }, [normalizedRoom, user?.id]);

    const refreshState = useCallback(() => {
        if (!normalizedRoom || !user?.id) return;
        socket.emit("war:state", { roomCode: normalizedRoom, userId: user.id }, (response) => {
            if (response?.success) setState(response.state);
            else setError(response?.message || "Unable to refresh War.");
        });
    }, [normalizedRoom, user?.id]);

    return { state, error, connected, startBattle, refreshState };
}
