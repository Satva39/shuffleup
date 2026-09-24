import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

export default function TurnIndicator({ state, userId }) {
  const mine = state?.currentPlayerId === userId && state?.status === "playing";
  const name =
    state?.players?.find((player) => player.id === state?.currentPlayerId)
      ?.username || "—";
  const animationKey = useGameAnimation(
    `${state?.currentPlayerId || "none"}:${state?.status || "none"}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`sps-turn-indicator ${mine ? "sps-turn-indicator--mine" : ""}`}
    >
      {mine ? "YOUR TURN" : `${name}'s TURN`}
    </GameAnimation>
  );
}
