import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../../services/socket";

export function useMindiCoatSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const joinedRef = useRef(false);

    useEffect(() => {
        if (!user || !roomCode) return undefined;
        const normalized = roomCode.toUpperCase();
        setError("");

        const onState = (nextState) => setState(nextState);
        const onError = ({ message }) => setError(message || "Mindi Coat action failed.");
        const join = () => {
            socket.emit("mindi-coat:join", { roomCode: normalized, userId: user.id }, (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to join Mindi Coat.");
                    return;
                }
                joinedRef.current = true;
                setState(response.state);
            });
        };
        const reconnect = () => {
            if (!joinedRef.current) {
                join();
                return;
            }
            socket.emit("mindi-coat:reconnect", { roomCode: normalized, userId: user.id }, (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to reconnect Mindi Coat.");
                    return;
                }
                setState(response.state);
            });
        };

        socket.on("mindi-coat:state", onState);
        socket.on("mindi-coat:error", onError);
        socket.on("connect", reconnect);

        if (!socket.connected) socket.connect();
        else join();

        return () => {
            socket.off("mindi-coat:state", onState);
            socket.off("mindi-coat:error", onError);
            socket.off("connect", reconnect);
            joinedRef.current = false;
        };
    }, [roomCode, user]);

    const selectTrump = useCallback((cardId) => new Promise((resolve) => {
        socket.emit("mindi-coat:trump-select", { roomCode, userId: user.id, cardId }, (response) => {
            if (!response?.success) setError(response?.message || "Trump selection rejected.");
            resolve(response);
        });
    }), [roomCode, user]);

    const openHukum = useCallback(() => new Promise((resolve) => {
        socket.emit("mindi-coat:open-hukum", { roomCode, userId: user.id }, (response) => {
            if (!response?.success) setError(response?.message || "Unable to open Hukum.");
            resolve(response);
        });
    }), [roomCode, user]);

    const playCard = useCallback((cardId) => new Promise((resolve) => {
        socket.emit("mindi-coat:play-card", { roomCode, userId: user.id, cardId }, (response) => {
            if (!response?.success) setError(response?.message || "Card play rejected.");
            resolve(response);
        });
    }), [roomCode, user]);

    const nextHand = useCallback(() => new Promise((resolve) => {
        socket.emit("mindi-coat:next-hand", { roomCode, userId: user.id }, (response) => {
            if (!response?.success) setError(response?.message || "Unable to start the next hand.");
            resolve(response);
        });
    }), [roomCode, user]);

    const refreshState = useCallback(() => {
        if (!user || !roomCode) return;
        socket.emit("mindi-coat:state", { roomCode, userId: user.id }, (response) => {
            if (response?.success) setState(response.state);
            else setError(response?.message || "Unable to refresh Mindi Coat.");
        });
    }, [roomCode, user]);

    return { state, error, selectTrump, openHukum, playCard, nextHand, refreshState };
}
