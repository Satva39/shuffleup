import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { socket } from "../../../services/socket";

export function useMangooseSocket(
    roomCode,
    user
) {
    const [gameState, setGameState] =
        useState(null);
    const [connected, setConnected] =
        useState(socket.connected);
    const [error, setError] =
        useState("");
    const [notice, setNotice] =
        useState(null);
    const noticeTimerRef = useRef(null);

    const showNotice = useCallback(
        (message) => {
            if (!message) {
                return;
            }

            setNotice({
                id: Date.now(),
                message,
            });

            window.clearTimeout(
                noticeTimerRef.current
            );

            noticeTimerRef.current =
                window.setTimeout(() => {
                    setNotice(null);
                }, 3500);
        },
        []
    );

    const joinGame = useCallback(() => {
        if (!user?.id || !roomCode) {
            return;
        }

        socket.emit(
            "mangoose:join",
            {
                roomCode:
                    roomCode.toUpperCase(),
                userId: user.id,
            },
            (response) => {
                if (!response?.success) {
                    setError(
                        response?.message ||
                        "Unable to join Mangoose."
                    );
                    return;
                }

                setError("");
                setGameState(
                    response.state
                );
            }
        );
    }, [roomCode, user?.id]);

    const connectToGame =
        useCallback(() => {
            if (!user?.id || !roomCode) {
                return;
            }

            if (!socket.connected) {
                socket.connect();
                return;
            }

            joinGame();
        }, [
            joinGame,
            roomCode,
            user?.id,
        ]);

    useEffect(() => {
        if (!user?.id || !roomCode) {
            return undefined;
        }

        const handleState = (state) => {
            setGameState(state);
            setError("");
        };

        const handlePublicState = (
            publicState
        ) => {
            setGameState((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    ...publicState,
                };
            });
        };

        const handleError = ({
            message,
        }) => {
            setError(
                message ||
                "Something went wrong."
            );
        };

        const handleNotice = ({
            message,
        }) => {
            showNotice(message);
        };

        const handleDisconnect = () => {
            setConnected(false);
        };

        const handleConnect = () => {
            setConnected(true);
            joinGame();
        };

        socket.on(
            "mangoose:state",
            handleState
        );
        socket.on(
            "mangoose:public-state",
            handlePublicState
        );
        socket.on(
            "mangoose:error",
            handleError
        );
        socket.on(
            "mangoose:notice",
            handleNotice
        );
        socket.on(
            "disconnect",
            handleDisconnect
        );
        socket.on(
            "connect",
            handleConnect
        );

        connectToGame();

        return () => {
            socket.off(
                "mangoose:state",
                handleState
            );
            socket.off(
                "mangoose:public-state",
                handlePublicState
            );
            socket.off(
                "mangoose:error",
                handleError
            );
            socket.off(
                "mangoose:notice",
                handleNotice
            );
            socket.off(
                "disconnect",
                handleDisconnect
            );
            socket.off(
                "connect",
                handleConnect
            );

            window.clearTimeout(
                noticeTimerRef.current
            );
        };
    }, [
        connectToGame,
        joinGame,
        roomCode,
        showNotice,
        user?.id,
    ]);

    const sendAction = useCallback(
        (action, target = null) => {
            if (!user?.id || !roomCode) {
                return;
            }

            setError("");

            socket.emit(
                "mangoose:action",
                {
                    roomCode:
                        roomCode.toUpperCase(),
                    userId: user.id,
                    action,
                    target,
                },
                (response) => {
                    if (!response?.success) {
                        setError(
                            response?.message ||
                            "Action rejected."
                        );
                    }
                }
            );
        },
        [roomCode, user?.id]
    );

    return {
        gameState,
        connected,
        error,
        notice,
        sendAction,
        reconnect: connectToGame,
    };
}
