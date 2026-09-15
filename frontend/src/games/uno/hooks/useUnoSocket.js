import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../../services/socket";

export function useUnoSocket(roomCode, user) {
    const [gameState, setGameState] = useState(null);
    const [connected, setConnected] = useState(socket.connected);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const noticeTimer = useRef(null);

    const showNotice = useCallback((message) => {
        if (!message) return;
        setNotice(message);
        window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
    }, []);

    const joinGame = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit("uno:join", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) {
                setError(response?.message || "Unable to join UNO.");
                return;
            }
            setError("");
            setGameState(response.state);
        });
    }, [roomCode, user?.id]);

    useEffect(() => {
        if (!roomCode || !user?.id) return undefined;

        const handleState = (state) => {
            setGameState(state);
            setError("");
        };
        const handlePublicState = (publicState) => {
            setGameState((current) => current ? { ...current, ...publicState } : current);
        };
        const handleError = ({ message }) => setError(message || "Action rejected.");
        const handleNotice = ({ message }) => showNotice(message);
        const handleDisconnect = () => setConnected(false);
        const handleConnect = () => {
            setConnected(true);
            joinGame();
        };
        const handleAction = (payload) => {
            const messages = {
                "uno:card-played": `${payload.playerId === user.id ? "You played" : "A player played"} a card.`,
                "uno:card-drawn": payload.playerId === user.id ? "You drew a card." : "A player drew a card.",
                "uno:color-required": "Choose the next color.",
                "uno:color-chosen": `${String(payload.color || "").toUpperCase()} is now active.`,
                "uno:uno": payload.playerId === user.id ? "UNO!" : "A player called UNO.",
                "uno:uno-called": "UNO challenge applied.",
            };
            showNotice(messages[payload.eventName] || "Table updated.");
        };

        const bindings = [
            ["uno:state", handleState],
            ["uno:public-state", handlePublicState],
            ["uno:error", handleError],
            ["uno:notice", handleNotice],
            ["disconnect", handleDisconnect],
            ["connect", handleConnect],
        ];

        socket.on("uno:card-played", (payload) => handleAction({ ...payload, eventName: "uno:card-played" }));
        socket.on("uno:card-drawn", (payload) => handleAction({ ...payload, eventName: "uno:card-drawn" }));
        socket.on("uno:color-required", (payload) => handleAction({ ...payload, eventName: "uno:color-required" }));
        socket.on("uno:color-chosen", (payload) => handleAction({ ...payload, eventName: "uno:color-chosen" }));
        socket.on("uno:uno", (payload) => handleAction({ ...payload, eventName: "uno:uno" }));
        socket.on("uno:uno-called", (payload) => handleAction({ ...payload, eventName: "uno:uno-called" }));
        socket.on("uno:round-started", () => showNotice("Next round started."));

        bindings.forEach(([event, handler]) => socket.on(event, handler));

        if (!socket.connected) socket.connect();
        else joinGame();

        return () => {
            bindings.forEach(([event, handler]) => socket.off(event, handler));
            socket.off("uno:card-played");
            socket.off("uno:card-drawn");
            socket.off("uno:color-required");
            socket.off("uno:color-chosen");
            socket.off("uno:uno");
            socket.off("uno:uno-called");
            socket.off("uno:round-started");
            window.clearTimeout(noticeTimer.current);
        };
    }, [joinGame, roomCode, showNotice, user?.id]);

    const sendAction = useCallback((action, payload = {}) => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("uno:action", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            action,
            payload,
        }, (response) => {
            if (!response?.success) setError(response?.message || "Action rejected.");
        });
    }, [roomCode, user?.id]);

    return { gameState, connected, error, notice, sendAction, reconnect: joinGame };
}
