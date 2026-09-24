import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function TurnIndicator({ state, localPlayerId }) {
  const current = state?.players?.find(
    (player) => player.id === state.currentPlayerId,
  );
  const target = state?.players?.find(
    (player) => player.id === state.targetPlayerId,
  );
  const mine = state?.currentPlayerId === localPlayerId;
  const animationKey = useGameAnimation(
    `${state?.currentPlayerId || "none"}:${state?.targetPlayerId || "none"}:${state?.status || "none"}`,
  );

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className="jt-turn-indicator"
    >
      <span>
        {mine
          ? "YOUR TURN"
          : current
            ? `${current.username}'S TURN`
            : "ROUND COMPLETE"}
      </span>
      {target && state?.status === "playing" && (
        <small>DRAW FROM {target.username}</small>
      )}
    </GameAnimation>
  );
}

export default TurnIndicator;
