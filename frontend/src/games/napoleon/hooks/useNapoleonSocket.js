import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../../services/socket";

export function useNapoleonSocket(roomCode, user) {
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(socket.connected);
    const [reconnecting, setReconnecting] = useState(false);
    const joinTimerRef = useRef(null);

    useEffect(() => {
        if (!user?.id || !roomCode) return;

        const clearJoinTimer = () => {
            if (joinTimerRef.current) {
                clearTimeout(joinTimerRef.current);
                joinTimerRef.current = null;
            }
        };

        const join = () => {
            clearJoinTimer();
            setError("");

            joinTimerRef.current = setTimeout(() => {
                setError(
                    "Napoleon server did not respond. Please restart the backend and reload this table."
                );
            }, 8000);

            socket.emit(
                "napoleon:join",
                {
                    roomCode: roomCode.toUpperCase(),
                    userId: user.id,
                },
                (response) => {
                    clearJoinTimer();

                    if (!response?.success) {
                        setError(
                            response?.message ||
                            "Unable to join Napoleon."
                        );
                    }
                }
            );
        };

        function handleConnect() {
            setConnected(true);
            setReconnecting(false);
            setError("");
            join();
        }

        function handleDisconnect() {
            clearJoinTimer();
            setConnected(false);
            setReconnecting(true);
        }

        function handleConnectError(error) {
            clearJoinTimer();
            setConnected(false);
            setReconnecting(false);
            setError(
                error?.message ||
                "Unable to connect to the Napoleon server."
            );
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
        socket.on("connect_error", handleConnectError);
        socket.on("napoleon:state", handleState);
        socket.on("napoleon:error", handleError);

        if (!socket.connected) {
            socket.connect();
        } else {
            join();
        }

        return () => {
            clearJoinTimer();
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("napoleon:state", handleState);
            socket.off("napoleon:error", handleError);
        };
    }, [roomCode, user]);

    const emitAction = useCallback(
        (event, payload, fallback) => {
            if (!user?.id || !roomCode) return;

            setError("");

            socket.emit(
                event,
                {
                    roomCode: roomCode.toUpperCase(),
                    userId: user.id,
                    ...payload,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message || fallback
                        );
                    }
                }
            );
        },
        [roomCode, user]
    );

    const submitBid = useCallback(
        (bid) =>
            emitAction(
                "napoleon:bid",
                { bid },
                "Unable to submit bid."
            ),
        [emitAction]
    );

    const callPartner = useCallback(
        (card) =>
            emitAction(
                "napoleon:call-partner",
                { card },
                "Unable to call the partner."
            ),
        [emitAction]
    );

    const discard = useCallback(
        (cardIds) =>
            emitAction(
                "napoleon:discard",
                { cardIds },
                "Unable to discard cards."
            ),
        [emitAction]
    );

    const playCard = useCallback(
        (cardId) =>
            emitAction(
                "napoleon:play-card",
                { cardId },
                "Unable to play that card."
            ),
        [emitAction]
    );

    const nextRound = useCallback(
        () =>
            emitAction(
                "napoleon:next-round",
                {},
                "Unable to start the next round."
            ),
        [emitAction]
    );

    return {
        gameState,
        error,
        connected,
        reconnecting,
        submitBid,
        callPartner,
        discard,
        playCard,
        nextRound,
    };
}
