import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";
import { useAuth } from "../../../context/AuthStore";

export default function useSolitaireSocket({ roomCode }) {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(shuffleSocket.isConnected());
  const joinedRef = useRef(false);

  const normalizedRoom = String(roomCode || "")
    .trim()
    .toUpperCase();

  const join = useCallback(
    (reconnect = false) => {
      if (!normalizedRoom || !user?.id) return;
      const event = reconnect ? "solitaire:reconnect" : "solitaire:join";
      shuffleSocket.emitSafe(
        event,
        { roomCode: normalizedRoom, userId: user.id },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Unable to join Solitaire.");
            return;
          }
          joinedRef.current = true;
          setState(response.state);
          setError("");
        },
      );
    },
    [normalizedRoom, user?.id],
  );

  useEffect(() => {
    if (!normalizedRoom || !user?.id) return undefined;

    const onConnect = () => {
      setConnected(true);
      join(joinedRef.current);
    };
    const onDisconnect = () => setConnected(false);
    const onState = (next) => setState(next);
    const onProgress = (publicState) =>
      setState((current) =>
        current
          ? {
              ...current,
              status: publicState.status,
              completedAt: publicState.completedAt,
              players: publicState.players,
              rankings: publicState.rankings,
            }
          : current,
      );
    const onRanking = (rankings) =>
      setState((current) => (current ? { ...current, rankings } : current));
    const onMoveResult = (response) => {
      if (response?.success) {
        setState(response.state);
        setError("");
      }
    };
    const onError = (payload) =>
      setError(payload?.message || "Solitaire action failed.");
    const onComplete = (publicState) =>
      setState((current) =>
        current
          ? {
              ...current,
              players: publicState.players,
              rankings: publicState.rankings,
              status: publicState.status,
              completedAt: publicState.completedAt,
            }
          : current,
      );

    const cleanup = [
      shuffleSocket.on("connect", onConnect),
      shuffleSocket.on("disconnect", onDisconnect),
      shuffleSocket.on("solitaire:state", onState),
      shuffleSocket.on("solitaire:progress", onProgress),
      shuffleSocket.on("solitaire:ranking-update", onRanking),
      shuffleSocket.on("solitaire:move-result", onMoveResult),
      shuffleSocket.on("solitaire:error", onError),
      shuffleSocket.on("solitaire:game-complete", onComplete),
    ];

    setConnected(shuffleSocket.isConnected());
    if (shuffleSocket.isConnected()) join(joinedRef.current);

    return () => cleanup.forEach((fn) => fn?.());
  }, [join, normalizedRoom, user?.id]);

  const sendMove = useCallback(
    (move) => {
      if (!normalizedRoom || !user?.id) return;
      setError("");
      shuffleSocket.emitSafe(
        "solitaire:move",
        { roomCode: normalizedRoom, userId: user.id, move },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Illegal move.");
            return;
          }
          setState(response.state);
        },
      );
    },
    [normalizedRoom, user?.id],
  );

  const drawStock = useCallback(() => {
    if (!normalizedRoom || !user?.id) return;
    setError("");
    shuffleSocket.emitSafe(
      "solitaire:draw-stock",
      { roomCode: normalizedRoom, userId: user.id },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to draw from stock.");
          return;
        }
        setState(response.state);
      },
    );
  }, [normalizedRoom, user?.id]);

  const refreshState = useCallback(() => {
    if (!normalizedRoom || !user?.id) return;
    shuffleSocket.emitSafe(
      "solitaire:state",
      { roomCode: normalizedRoom, userId: user.id },
      (response) => {
        if (response?.success) {
          setState(response.state);
          setError("");
        } else {
          setError(response?.message || "Unable to refresh Solitaire.");
        }
      },
    );
  }, [normalizedRoom, user?.id]);

  return { state, error, connected, user, sendMove, drawStock, refreshState };
}
