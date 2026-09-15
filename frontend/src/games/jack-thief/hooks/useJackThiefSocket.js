import { useCallback, useEffect, useState } from "react";
import { socket } from "../../../services/socket";

export function useJackThiefSocket(roomCode, user) {
    const [gameState, setGameState] = useState(null);
    const [connected, setConnected] = useState(socket.connected);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const joinGame = useCallback(() => {
        if (!roomCode || !user?.id) return;
        socket.emit("jack-thief:join", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
        }, (response) => {
            if (!response?.success) {
                setError(response?.message || "Unable to join Jack Thief.");
                return;
            }
            setGameState(response.state);
            setError("");
        });
    }, [roomCode, user?.id]);

    useEffect(() => {
        const onState = (state) => setGameState(state);
        const onPublicState = (state) => setGameState((current) => current ? { ...current, ...state } : state);
        const onError = ({ message }) => setError(message || "Action rejected.");
        const onDisconnect = () => {
            setConnected(false);
            setNotice("RECONNECTING...");
        };
        const onConnect = () => {
            setConnected(true);
            setNotice("RESTORING YOUR SEAT...");
            joinGame();
        };
        const onTurn = (payload) => {
            if (payload.playerId === user?.id) setNotice("YOUR TURN");
            else setNotice("WAITING FOR ANOTHER PLAYER");
        };
        const onCardDrawn = (payload) => {
            if (payload.playerId === user?.id) setNotice(payload.formedPairs?.length ? "PAIR FOUND" : "CARD DRAWN");
            else setNotice("A CARD WAS DRAWN");
        };
        const onPair = () => setNotice("PAIR REMOVED");
        const onFinished = (payload) => {
            if (payload.playerId === user?.id) setNotice(`YOU FINISHED #${payload.eliminationPlace}`);
            else setNotice("PLAYER FINISHED");
        };
        const onComplete = () => setNotice("GAME COMPLETE");
        const onStatus = (payload) => {
            setGameState((current) => current ? {
                ...current,
                players: current.players?.map((player) => player.id === payload.playerId
                    ? { ...player, connected: payload.connected, status: payload.connected ? "active" : "disconnected" }
                    : player),
            } : current);
        };

        socket.on("jack-thief:state", onState);
        socket.on("jack-thief:public-state", onPublicState);
        socket.on("jack-thief:error", onError);
        socket.on("jack-thief:turn", onTurn);
        socket.on("jack-thief:card-drawn", onCardDrawn);
        socket.on("jack-thief:pair-removed", onPair);
        socket.on("jack-thief:player-finished", onFinished);
        socket.on("jack-thief:game-complete", onComplete);
        socket.on("jack-thief:player-status", onStatus);
        socket.on("disconnect", onDisconnect);
        socket.on("connect", onConnect);

        if (!socket.connected) socket.connect();
        else joinGame();

        return () => {
            socket.off("jack-thief:state", onState);
            socket.off("jack-thief:public-state", onPublicState);
            socket.off("jack-thief:error", onError);
            socket.off("jack-thief:turn", onTurn);
            socket.off("jack-thief:card-drawn", onCardDrawn);
            socket.off("jack-thief:pair-removed", onPair);
            socket.off("jack-thief:player-finished", onFinished);
            socket.off("jack-thief:game-complete", onComplete);
            socket.off("jack-thief:player-status", onStatus);
            socket.off("disconnect", onDisconnect);
            socket.off("connect", onConnect);
        };
    }, [joinGame, user?.id]);

    const drawCard = useCallback((targetPlayerId, cardIndex) => {
        if (!roomCode || !user?.id) return;
        setError("");
        socket.emit("jack-thief:draw", {
            roomCode: roomCode.toUpperCase(),
            userId: user.id,
            targetPlayerId,
            cardIndex,
        }, (response) => {
            if (!response?.success) setError(response?.message || "That card cannot be drawn.");
        });
    }, [roomCode, user?.id]);

    return { gameState, connected, error, notice, drawCard, reconnect: joinGame };
}
