import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

export default function TurnIndicator({ state, localPlayerId }) {
  const mine =
    state?.currentPlayerId === localPlayerId && state?.phase === "play";
  const current = state?.players?.find(
    (player) => player.id === state?.currentPlayerId,
  );
  const animationKey = useGameAnimation(
    `${state?.currentPlayerId || "none"}:${state?.phase || "none"}:${mine}`,
  );

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`bluff-turn${mine ? " mine" : ""}`}
    >
      <span>
        {mine ? "YOUR TURN" : `${current?.username || "Player"}'s turn`}
      </span>
      <strong>{state?.requiredRank}</strong>
    </GameAnimation>
  );
}
