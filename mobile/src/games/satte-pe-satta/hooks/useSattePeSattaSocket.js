import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export function useSattePeSattaSocket({ roomCode, user }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(
    shuffleSocket.isConnected() ? "connected" : "connecting",
  );
  const initialJoinRef = useRef(false);

  const normalizedCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const joinGame = useCallback(() => {
    if (!normalizedCode || !user?.id) return;

    shuffleSocket.emitSafe(
      "satte-pe-satta:join",
      { roomCode: normalizedCode, userId: user.id },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join Satte Pe Satta.");
          return;
        }
        initialJoinRef.current = true;
        setState(response.state || null);
        setError("");
      },
    );
  }, [normalizedCode, user?.id]);

  const reconnectGame = useCallback(() => {
    if (!normalizedCode || !user?.id) return;

    shuffleSocket.emitSafe(
      "satte-pe-satta:reconnect",
      { roomCode: normalizedCode, userId: user.id },
      (response) => {
        if (response?.success) {
          setState(response.state || null);
          setError("");
          return;
        }
        joinGame();
      },
    );
  }, [joinGame, normalizedCode, user?.id]);

  useEffect(() => {
    if (!normalizedCode || !user?.id) return undefined;

    const offState = shuffleSocket.on("satte-pe-satta:state", (nextState) => {
      if (nextState) setState(nextState);
      setError("");
    });

    const offPublicState = shuffleSocket.on(
      "satte-pe-satta:public-state",
      (nextPublic) => {
        if (!nextPublic) return;
        setState((current) =>
          current ? { ...current, ...nextPublic } : nextPublic,
        );
      },
    );

    const offError = shuffleSocket.on("satte-pe-satta:error", (payload) => {
      setError(payload?.message || "Satte Pe Satta action rejected.");
    });

    const offConnect = shuffleSocket.on("connect", () => {
      setConnection("connected");
      if (initialJoinRef.current) reconnectGame();
      else joinGame();
    });

    const offDisconnect = shuffleSocket.on("disconnect", () => {
      setConnection("reconnecting");
    });

    const offConnectError = shuffleSocket.on("connect_error", () => {
      setConnection("error");
    });

    const offReconnectAttempt = shuffleSocket.on("reconnect_attempt", () => {
      setConnection("reconnecting");
    });

    if (shuffleSocket.isConnected()) {
      setConnection("connected");
      if (initialJoinRef.current) reconnectGame();
      else joinGame();
    } else {
      setConnection("connecting");
      shuffleSocket.getSocket()?.connect();
    }

    return () => {
      offState();
      offPublicState();
      offError();
      offConnect();
      offDisconnect();
      offConnectError();
      offReconnectAttempt();
    };
  }, [joinGame, normalizedCode, reconnectGame, user?.id]);

  const playCard = useCallback(
    (cardId) => {
      if (!normalizedCode || !user?.id || !cardId) return;
      setError("");

      shuffleSocket.emitSafe(
        "satte-pe-satta:play-card",
        {
          roomCode: normalizedCode,
          userId: user.id,
          cardId,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Card could not be played.");
          }
        },
      );
    },
    [normalizedCode, user?.id],
  );

  const pass = useCallback(() => {
    if (!normalizedCode || !user?.id) return;
    setError("");

    shuffleSocket.emitSafe(
      "satte-pe-satta:pass",
      { roomCode: normalizedCode, userId: user.id },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Pass rejected.");
        }
      },
    );
  }, [normalizedCode, user?.id]);

  return {
    state,
    error,
    connection,
    connected: connection === "connected",
    playCard,
    pass,
  };
}
