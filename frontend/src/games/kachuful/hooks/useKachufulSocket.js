import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useKachufulSocket(roomCode, user) {
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);
    const [reconnecting, setReconnecting] = useState(false);

    useEffect(() => {
        if (!user?.id || !roomCode) return;

        function handleConnect() {
            setConnected(true);
            setReconnecting(false);
            setError("");

            socket.emit(
                "kachuful:join",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId: user.id,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message ||
                            "Unable to join Kachuful."
                        );
                    }
                }
            );
        }

        function handleDisconnect() {
            setConnected(false);
            setReconnecting(true);
        }

        function handleState(state) {
            setGameState(state);
            setError("");
            setReconnecting(false);
        }

        function handleError(data) {
            setError(
                data?.message ||
                "Something went wrong."
            );
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("kachuful:state", handleState);
        socket.on("kachuful:error", handleError);

        if (!socket.connected) {
            socket.connect();
        } else {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("kachuful:state", handleState);
            socket.off("kachuful:error", handleError);
        };
    }, [roomCode, user]);

    const submitBid = useCallback(
        (bid) => {
            if (!user?.id || !roomCode) return;

            setError("");

            socket.emit(
                "kachuful:bid",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId: user.id,
                    bid,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message ||
                            "Unable to submit bid."
                        );
                    }
                }
            );
        },
        [roomCode, user]
    );

    const playCard = useCallback(
        (cardId) => {
            if (!user?.id || !roomCode) return;

            setError("");

            socket.emit(
                "kachuful:play-card",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId: user.id,
                    cardId,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message ||
                            "Unable to play that card."
                        );
                    }
                }
            );
        },
        [roomCode, user]
    );

    const nextRound = useCallback(() => {
        if (!user?.id || !roomCode) return;

        setError("");

        socket.emit(
            "kachuful:next-round",
            {
                roomCode: roomCode.toUpperCase(),
                userId: user.id,
            },
            (response) => {
                if (!response?.success) {
                    setError(
                        response?.message ||
                        "Unable to start the next round."
                    );
                }
            }
        );
    }, [roomCode, user]);

    return {
        gameState,
        error,
        connected,
        reconnecting,
        submitBid,
        playCard,
        nextRound,
    };
}