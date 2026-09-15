import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useSattePeSattaSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    const join = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit("satte-pe-satta:join", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) {
                setError(response?.message || "Unable to join Satte Pe Satta.");
                return;
            }
            setState(response.state);
            setError("");
        });
    }, [roomCode, user?.id]);

    useEffect(() => {
        if (!roomCode || !user?.id) return undefined;

        const onState = (next) => setState(next);
        const onPublicState = (next) => setState((current) => current ? { ...current, ...next } : next);
        const onError = ({ message }) => setError(message || "Satte Pe Satta action rejected.");
        const onConnect = () => { setConnected(true); join(); };
        const onDisconnect = () => setConnected(false);

        socket.on("satte-pe-satta:state", onState);
        socket.on("satte-pe-satta:public-state", onPublicState);
        socket.on("satte-pe-satta:error", onError);
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (!socket.connected) socket.connect();
        else join();

        return () => {
            socket.off("satte-pe-satta:state", onState);
            socket.off("satte-pe-satta:public-state", onPublicState);
            socket.off("satte-pe-satta:error", onError);
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [roomCode, user?.id, join]);

    const playCard = useCallback((cardId) => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("satte-pe-satta:play-card", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            cardId,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Card could not be played.");
        });
    }, [roomCode, user?.id]);

    const pass = useCallback(() => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("satte-pe-satta:pass", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Pass rejected.");
        });
    }, [roomCode, user?.id]);

    return { state, error, connected, playCard, pass };
}
