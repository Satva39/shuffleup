import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../../services/socket";

export function useSpadesSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const joinedRef = useRef(false);

    useEffect(() => {
        if (!user || !roomCode) return undefined;
        setError("");
        const normalized = roomCode.toUpperCase();

        const onState = (nextState) => setState(nextState);
        const onError = ({ message }) => setError(message || "Spades action failed.");

        socket.on("spades:state", onState);
        socket.on("spades:error", onError);

        const join = () => {
            socket.emit("spades:join", { roomCode: normalized, userId: user.id }, (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to join Spades.");
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
            socket.emit("spades:reconnect", { roomCode: normalized, userId: user.id }, (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to reconnect Spades.");
                    return;
                }
                setState(response.state);
            });
        };

        socket.on("connect", reconnect);
        if (!socket.connected) socket.connect();
        else join();

        return () => {
            socket.off("spades:state", onState);
            socket.off("spades:error", onError);
            socket.off("connect", reconnect);
            joinedRef.current = false;
        };
    }, [roomCode, user]);

    const refreshState = useCallback(() => {
        if (!user || !roomCode) return;
        socket.emit("spades:state", { roomCode, userId: user.id }, (response) => {
            if (response?.success) setState(response.state);
            else setError(response?.message || "Unable to refresh Spades.");
        });
    }, [roomCode, user]);

    const submitBid = useCallback((bid) => {
        return new Promise((resolve) => {
            socket.emit("spades:bid", { roomCode, userId: user.id, bid }, (response) => {
                if (!response?.success) setError(response?.message || "Bid rejected.");
                resolve(response);
            });
        });
    }, [roomCode, user]);

    const playCard = useCallback((cardId) => {
        return new Promise((resolve) => {
            socket.emit("spades:play-card", { roomCode, userId: user.id, cardId }, (response) => {
                if (!response?.success) setError(response?.message || "Card play rejected.");
                resolve(response);
            });
        });
    }, [roomCode, user]);

    const nextHand = useCallback(() => {
        return new Promise((resolve) => {
            socket.emit("spades:next-hand", { roomCode, userId: user.id }, (response) => {
                if (!response?.success) setError(response?.message || "Unable to start the next hand.");
                resolve(response);
            });
        });
    }, [roomCode, user]);

    return { state, error, submitBid, playCard, nextHand, refreshState };
}
