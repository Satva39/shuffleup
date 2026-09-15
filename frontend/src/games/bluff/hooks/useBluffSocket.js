import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useBluffSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    const join = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit("bluff:join", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) {
                setError(response?.message || "Unable to join Bluff.");
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
        const onError = ({ message }) => setError(message || "Bluff action rejected.");
        const onConnect = () => {
            setConnected(true);
            join();
        };
        const onDisconnect = () => setConnected(false);

        socket.on("bluff:state", onState);
        socket.on("bluff:public-state", onPublicState);
        socket.on("bluff:error", onError);
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (!socket.connected) socket.connect();
        else join();

        return () => {
            socket.off("bluff:state", onState);
            socket.off("bluff:public-state", onPublicState);
            socket.off("bluff:error", onError);
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [roomCode, user?.id, join]);

    const playCards = useCallback((cardIds) => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("bluff:play-cards", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            cardIds,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Cards could not be played.");
        });
    }, [roomCode, user?.id]);

    const expireChallenge = useCallback((claimId) => {
        if (!roomCode || !user?.id || !claimId) return;
        socket.emit("bluff:expire", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            claimId,
        });
    }, [roomCode, user?.id]);

    const challenge = useCallback(() => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("bluff:challenge", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Challenge rejected.");
        });
    }, [roomCode, user?.id]);

    const refreshState = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit("bluff:state", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (response?.success) setState(response.state);
            else setError(response?.message || "Unable to refresh Bluff.");
        });
    }, [roomCode, user?.id]);

    return { state, error, connected, playCards, challenge, expireChallenge, refreshState };
}
