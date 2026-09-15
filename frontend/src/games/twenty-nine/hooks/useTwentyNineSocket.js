import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useTwentyNineSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    const joinGame = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit(
            "twenty-nine:join",
            { roomCode: roomCode.toUpperCase(), userId: user.id },
            (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to join Twenty-Nine.");
                    return;
                }
                setError("");
                setState(response.state || null);
            }
        );
    }, [roomCode, user?.id]);

    useEffect(() => {
        if (!roomCode || !user?.id) return undefined;

        function handleConnect() {
            setConnected(true);
            joinGame();
        }
        function handleDisconnect() {
            setConnected(false);
        }
        function handleState(nextState) {
            setState(nextState);
            setError("");
        }
        function handleError(payload) {
            setError(payload?.message || "Twenty-Nine action failed.");
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("twenty-nine:state", handleState);
        socket.on("twenty-nine:error", handleError);

        if (!socket.connected) socket.connect();
        else joinGame();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("twenty-nine:state", handleState);
            socket.off("twenty-nine:error", handleError);
        };
    }, [joinGame, roomCode, user?.id]);

    const request = useCallback((event, payload) => {
        setError("");
        socket.emit(event, payload, (response) => {
            if (!response?.success) setError(response?.message || "Action failed.");
        });
    }, []);

    const submitBid = useCallback((bid) => {
        request("twenty-nine:bid", { roomCode, userId: user?.id, bid });
    }, [request, roomCode, user?.id]);

    const selectTrump = useCallback((suit) => {
        request("twenty-nine:trump", { roomCode, userId: user?.id, suit });
    }, [request, roomCode, user?.id]);

    const playCard = useCallback((cardId) => {
        request("twenty-nine:play-card", { roomCode, userId: user?.id, cardId });
    }, [request, roomCode, user?.id]);

    const nextHand = useCallback(() => {
        request("twenty-nine:next-hand", { roomCode, userId: user?.id });
    }, [request, roomCode, user?.id]);

    return { state, error, connected, submitBid, selectTrump, playCard, nextHand };
}
