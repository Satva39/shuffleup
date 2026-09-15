import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../../services/socket";

export function useSolitaireSocket({ roomCode, user }) {
    const [state, setState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);
    const roomRef = useRef(roomCode?.toUpperCase());

    const join = useCallback(() => {
        if (!user || !roomRef.current) return;

        setError("");

        socket.emit(
            "solitaire:join",
            {
                roomCode: roomRef.current,
                userId: user.id,
            },
            (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to join Solitaire.");
                    return;
                }

                setState(response.state);
            }
        );
    }, [user]);

    useEffect(() => {
        roomRef.current = roomCode?.toUpperCase();

        if (!user || !roomCode) return undefined;

        function handleConnect() {
            setConnected(true);
            socket.emit(
                "solitaire:reconnect",
                {
                    roomCode: roomRef.current,
                    userId: user.id,
                },
                (response) => {
                    if (response?.success) {
                        setState(response.state);
                        setError("");
                        return;
                    }

                    join();
                }
            );
        }

        function handleDisconnect() {
            setConnected(false);
        }

        function handleState(nextState) {
            setState(nextState);
        }

        function handleProgress(publicState) {
            setState((current) => (
                current
                    ? {
                        ...current,
                        status: publicState.status,
                        completedAt: publicState.completedAt,
                        players: publicState.players,
                        rankings: publicState.rankings,
                    }
                    : current
            ));
        }

        function handleRanking(rankings) {
            setState((current) => (
                current
                    ? { ...current, rankings }
                    : current
            ));
        }

        function handleMoveResult(response) {
            if (response?.success) {
                setState(response.state);
                setError("");
            }
        }

        function handleError(payload) {
            setError(payload?.message || "Solitaire action failed.");
        }

        function handleGameComplete(publicState) {
            setState((current) => (
                current
                    ? {
                        ...current,
                        status: publicState.status,
                        completedAt: publicState.completedAt,
                        players: publicState.players,
                        rankings: publicState.rankings,
                    }
                    : current
            ));
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("solitaire:state", handleState);
        socket.on("solitaire:progress", handleProgress);
        socket.on("solitaire:ranking-update", handleRanking);
        socket.on("solitaire:move-result", handleMoveResult);
        socket.on("solitaire:error", handleError);
        socket.on("solitaire:game-complete", handleGameComplete);

        if (!socket.connected) {
            socket.connect();
        } else {
            join();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("solitaire:state", handleState);
            socket.off("solitaire:progress", handleProgress);
            socket.off("solitaire:ranking-update", handleRanking);
            socket.off("solitaire:move-result", handleMoveResult);
            socket.off("solitaire:error", handleError);
            socket.off("solitaire:game-complete", handleGameComplete);
        };
    }, [join, roomCode, user]);

    const sendMove = useCallback((move) => {
        if (!user || !roomRef.current) return;

        setError("");

        socket.emit(
            "solitaire:move",
            {
                roomCode: roomRef.current,
                userId: user.id,
                move,
            },
            (response) => {
                if (!response?.success) {
                    setError(response?.message || "Illegal move.");
                    return;
                }

                setState(response.state);
            }
        );
    }, [user]);

    const drawStock = useCallback(() => {
        if (!user || !roomRef.current) return;

        setError("");

        socket.emit(
            "solitaire:draw-stock",
            {
                roomCode: roomRef.current,
                userId: user.id,
            },
            (response) => {
                if (!response?.success) {
                    setError(response?.message || "Unable to draw from stock.");
                    return;
                }

                setState(response.state);
            }
        );
    }, [user]);

    return {
        state,
        error,
        connected,
        sendMove,
        drawStock,
    };
}
