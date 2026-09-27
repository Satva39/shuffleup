import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useJackThiefSocket(roomCode, userId) {
  const [gameState, setGameState] = useState(null);
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const joinedRef = useRef(false);

  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const applyState = useCallback((state) => {
    if (state) {
      setGameState(state);
      setError("");
    }
  }, []);

  const joinGame = useCallback(() => {
    if (!userId || !normalizedCode) return;

    shuffleSocket.emitSafe(
      "jack-thief:join",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join Jack Thief.");
          return;
        }
        joinedRef.current = true;
        applyState(response.state);
      },
    );
  }, [applyState, normalizedCode, userId]);

  const reconnect = useCallback(() => {
    if (!userId || !normalizedCode) return;

    shuffleSocket.emitSafe(
      "jack-thief:reconnect",
      { roomCode: normalizedCode, userId },
      (response) => {
        if (!response?.success) {
          joinGame();
          return;
        }
        joinedRef.current = true;
        applyState(response.state);
      },
    );
  }, [applyState, joinGame, normalizedCode, userId]);

  useEffect(() => {
    if (!userId || !normalizedCode) return undefined;

    const handleConnect = () => {
      setConnection("connected");
      if (joinedRef.current) reconnect();
      else joinGame();
    };

    const handleDisconnect = () => setConnection("reconnecting");
    const handleConnectError = () => setConnection("error");
    const handleReconnectAttempt = () => setConnection("reconnecting");

    const handleState = (state) => applyState(state);

    const handlePublicState = (publicState) => {
      setGameState((current) =>
        current ? { ...current, ...publicState } : publicState || null,
      );
      setError("");
    };

    const handleError = ({ message } = {}) => {
      setError(message || "Action rejected.");
    };

    const handleTurn = ({ playerId } = {}) => {
      setNotice(
        playerId === userId ? "YOUR TURN" : "WAITING FOR ANOTHER PLAYER",
      );
    };

    const handleDeal = ({ removedPairs } = {}) => {
      if (removedPairs?.length) {
        setNotice(
          `${removedPairs.length} PAIR${removedPairs.length === 1 ? "" : "S"} REMOVED`,
        );
      }
    };

    const handleCardDrawn = ({ playerId, formedPairs, automatic } = {}) => {
      if (automatic) {
        setNotice("AUTO DRAW COMPLETED");
      } else if (playerId === userId) {
        setNotice(formedPairs?.length ? "PAIR FOUND" : "CARD DRAWN");
      } else {
        setNotice("A CARD WAS DRAWN");
      }
    };

    const handlePairRemoved = ({ pairs } = {}) => {
      if (pairs?.length) setNotice("PAIR REMOVED");
    };

    const handleFinished = ({ playerId, eliminationPlace } = {}) => {
      setNotice(
        playerId === userId
          ? `YOU FINISHED #${eliminationPlace}`
          : "PLAYER FINISHED",
      );
    };

    const handleStatus = ({ playerId, connected } = {}) => {
      setGameState((current) =>
        current
          ? {
              ...current,
              players: current.players?.map((player) =>
                player.id === playerId
                  ? {
                      ...player,
                      connected,
                      status: connected ? "active" : "disconnected",
                    }
                  : player,
              ),
            }
          : current,
      );
    };

    const handleComplete = () => setNotice("GAME COMPLETE");

    const unsubscribe = [
      shuffleSocket.on("connect", handleConnect),
      shuffleSocket.on("disconnect", handleDisconnect),
      shuffleSocket.on("connect_error", handleConnectError),
      shuffleSocket.on("reconnect_attempt", handleReconnectAttempt),
      shuffleSocket.on("jack-thief:state", handleState),
      shuffleSocket.on("jack-thief:public-state", handlePublicState),
      shuffleSocket.on("jack-thief:error", handleError),
      shuffleSocket.on("jack-thief:turn", handleTurn),
      shuffleSocket.on("jack-thief:deal", handleDeal),
      shuffleSocket.on("jack-thief:card-drawn", handleCardDrawn),
      shuffleSocket.on("jack-thief:pair-removed", handlePairRemoved),
      shuffleSocket.on("jack-thief:player-finished", handleFinished),
      shuffleSocket.on("jack-thief:player-status", handleStatus),
      shuffleSocket.on("jack-thief:round-complete", handleComplete),
      shuffleSocket.on("jack-thief:game-complete", handleComplete),
    ];

    if (shuffleSocket.isConnected()) handleConnect();
    else setConnection("connecting");

    return () => unsubscribe.forEach((off) => off?.());
  }, [applyState, joinGame, normalizedCode, reconnect, userId]);

  const drawCard = useCallback(
    (targetPlayerId, cardIndex) => {
      if (!userId || !normalizedCode) return;
      setError("");
      shuffleSocket.emitSafe(
        "jack-thief:draw",
        {
          roomCode: normalizedCode,
          userId,
          targetPlayerId,
          cardIndex,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "That card cannot be drawn.");
          }
        },
      );
    },
    [normalizedCode, userId],
  );

  return {
    gameState,
    connection,
    connected: connection === "connected",
    reconnecting: connection === "reconnecting" || connection === "connecting",
    error,
    notice,
    drawCard,
    reconnect,
  };
}
