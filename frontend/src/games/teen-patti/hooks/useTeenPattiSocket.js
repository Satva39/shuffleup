import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useTeenPattiSocket(roomCode, userId) {
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);

    useEffect(() => {
        if (!userId || !roomCode) return;

        function handleConnect() {
            setConnected(true);
            setError("");

            socket.emit(
                "teen-patti:join",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message || "Unable to join Teen Patti."
                        );
                        return;
                    }

                    if (response.state) {
                        setGameState(response.state);
                    }
                }
            );
        }

        function handleDisconnect() {
            setConnected(false);
        }

        function handleState(state) {
            setGameState(state);
            setError("");
        }

        function handlePublicState(publicState) {
            setGameState((current) => {
                if (!current) {
                    return publicState;
                }

                return {
                    ...publicState,
                    cards: current.cards || [],
                    legalActions: current.legalActions || [],
                };
            });
        }

        function handleError(message) {
            setError(
                typeof message === "string"
                    ? message
                    : message?.message || "Teen Patti error."
            );
        }

        function handleRoundComplete(roundResult) {
            setGameState((current) => {
                if (!current) return current;

                return {
                    ...current,
                    lastRoundResult: roundResult,
                };
            });
        }

        function handleGameComplete(result) {
            setGameState((current) => {
                if (!current) return current;

                return {
                    ...current,
                    status: "complete",
                    result,
                    winner: result?.winnerId || current.winner,
                };
            });
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("teen-patti:state", handleState);
        socket.on("teen-patti:public-state", handlePublicState);
        socket.on("teen-patti:error", handleError);
        socket.on("teen-patti:round-complete", handleRoundComplete);
        socket.on("teen-patti:game-complete", handleGameComplete);

        if (socket.connected) {
            handleConnect();
        } else {
            socket.connect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("teen-patti:state", handleState);
            socket.off("teen-patti:public-state", handlePublicState);
            socket.off("teen-patti:error", handleError);
            socket.off("teen-patti:round-complete", handleRoundComplete);
            socket.off("teen-patti:game-complete", handleGameComplete);
        };
    }, [roomCode, userId]);

    const sendAction = useCallback(
        (action) => {
            if (!userId || !roomCode) {
                return;
            }

            setError("");

            socket.emit(
                "teen-patti:action",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId,
                    action,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message || "Action failed."
                        );
                    }
                }
            );
        },
        [roomCode, userId]
    );

    return {
        gameState,
        error,
        connected,
        sendAction,
    };
}