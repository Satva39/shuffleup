import { useCallback, useEffect, useState } from "react";
import { shuffleSocket } from "../../../services/socket";

export default function useWarSocket({ roomCode, user }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(shuffleSocket.isConnected());

  const normalizedRoom = String(roomCode || "")
    .trim()
    .toUpperCase();
  const userId = user?.id;

  const join = useCallback(() => {
    if (!normalizedRoom || !userId) return;
    setError("");
    shuffleSocket.emitSafe(
      "war:join",
      { roomCode: normalizedRoom, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to join War.");
          return;
        }
        setState(response.state || null);
      },
    );
  }, [normalizedRoom, userId]);

  const refreshState = useCallback(() => {
    if (!normalizedRoom || !userId) return;
    setError("");
    shuffleSocket.emitSafe(
      "war:state",
      { roomCode: normalizedRoom, userId },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to refresh War.");
          return;
        }
        setState(response.state || null);
      },
    );
  }, [normalizedRoom, userId]);

  useEffect(() => {
    if (!normalizedRoom || !userId) return undefined;

    const onState = (nextState) => {
      setState(nextState || null);
      setError("");
    };

    const onError = (payload) => {
      setError(payload?.message || "War action was rejected.");
    };

    const onBattleStart = (nextState) => setState(nextState || null);
    const onWarStart = (nextState) => setState(nextState || null);
    const onWarReveal = (nextState) => setState(nextState || null);
    const onNextBattle = (nextState) => setState(nextState || null);
    const onGameComplete = (nextState) => setState(nextState || null);
    const onBattleResult = (payload) => {
      if (payload?.state) setState(payload.state);
    };

    const onConnect = () => {
      setConnected(true);
      shuffleSocket.emitSafe(
        "war:reconnect",
        { roomCode: normalizedRoom, userId },
        (response) => {
          if (response?.success) setState(response.state || null);
          else join();
        },
      );
    };

    const onDisconnect = () => setConnected(false);

    const removeState = shuffleSocket.on("war:state", onState);
    const removeError = shuffleSocket.on("war:error", onError);
    const removeBattleStart = shuffleSocket.on(
      "war:battle-start",
      onBattleStart,
    );
    const removeWarStart = shuffleSocket.on("war:war-start", onWarStart);
    const removeWarReveal = shuffleSocket.on("war:war-reveal", onWarReveal);
    const removeBattleResult = shuffleSocket.on(
      "war:battle-result",
      onBattleResult,
    );
    const removeNextBattle = shuffleSocket.on("war:next-battle", onNextBattle);
    const removeGameComplete = shuffleSocket.on(
      "war:game-complete",
      onGameComplete,
    );
    const removeConnect = shuffleSocket.on("connect", onConnect);
    const removeDisconnect = shuffleSocket.on("disconnect", onDisconnect);

    setConnected(shuffleSocket.isConnected());
    if (shuffleSocket.isConnected()) join();

    return () => {
      removeState();
      removeError();
      removeBattleStart();
      removeWarStart();
      removeWarReveal();
      removeBattleResult();
      removeNextBattle();
      removeGameComplete();
      removeConnect();
      removeDisconnect();
    };
  }, [join, normalizedRoom, userId]);

  return { state, error, connected, refreshState };
}
