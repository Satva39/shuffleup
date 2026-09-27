import { useCallback, useEffect, useRef, useState } from "react";
import { shuffleSocket } from "../../../services/socket";
import { useAuth } from "../../../context/AuthStore";

export default function useBluffSocket({ roomCode }) {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(shuffleSocket.isConnected());
  const joinedRef = useRef(false);

  const join = useCallback(
    (reconnect = false) => {
      if (!roomCode || !user?.id) return;
      const payload = {
        roomCode: String(roomCode).toUpperCase(),
        userId: user.id,
      };
      const event = reconnect ? "bluff:reconnect" : "bluff:join";
      shuffleSocket.emitSafe(event, payload, (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join Bluff.");
          return;
        }
        joinedRef.current = true;
        setState(response.state);
        setError("");
      });
    },
    [roomCode, user?.id],
  );

  useEffect(() => {
    if (!roomCode || !user?.id) return undefined;
    const onState = (next) => setState(next);
    const onPublicState = (next) =>
      setState((current) => (current ? { ...current, ...next } : next));
    const onError = ({ message }) =>
      setError(message || "Bluff action rejected.");
    const onConnect = () => {
      setConnected(true);
      join(joinedRef.current);
    };
    const onDisconnect = () => setConnected(false);
    const cleanups = [
      shuffleSocket.on("bluff:state", onState),
      shuffleSocket.on("bluff:public-state", onPublicState),
      shuffleSocket.on("bluff:error", onError),
      shuffleSocket.on("connect", onConnect),
      shuffleSocket.on("disconnect", onDisconnect),
    ];
    setConnected(shuffleSocket.isConnected());
    if (shuffleSocket.isConnected()) join(joinedRef.current);
    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [join, roomCode, user?.id]);

  const playCards = useCallback(
    (cardIds) => {
      if (!roomCode || !user?.id || !cardIds?.length) return;
      setError("");
      shuffleSocket.emitSafe(
        "bluff:play-cards",
        { roomCode: String(roomCode).toUpperCase(), userId: user.id, cardIds },
        (response) => {
          if (!response?.success)
            setError(response?.message || "Cards could not be played.");
        },
      );
    },
    [roomCode, user?.id],
  );

  const challenge = useCallback(() => {
    if (!roomCode || !user?.id) return;
    setError("");
    shuffleSocket.emitSafe(
      "bluff:challenge",
      { roomCode: String(roomCode).toUpperCase(), userId: user.id },
      (response) => {
        if (!response?.success)
          setError(response?.message || "Challenge rejected.");
      },
    );
  }, [roomCode, user?.id]);

  const refreshState = useCallback(() => {
    if (!roomCode || !user?.id) return;
    shuffleSocket.emitSafe(
      "bluff:state",
      { roomCode: String(roomCode).toUpperCase(), userId: user.id },
      (response) => {
        if (response?.success) setState(response.state);
        else setError(response?.message || "Unable to refresh Bluff.");
      },
    );
  }, [roomCode, user?.id]);

  return { state, error, connected, user, playCards, challenge, refreshState };
}
