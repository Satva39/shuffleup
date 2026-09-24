import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

export default function TurnIndicator({ yourTurn, currentName }) {
  const animationKey = useGameAnimation(
    `${currentName || "PLAYER"}:${yourTurn}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`rummy-turn ${yourTurn ? "your" : ""}`}
    >
      {yourTurn
        ? "YOUR TURN"
        : `WAITING FOR ${currentName?.toUpperCase() || "PLAYER"}`}
    </GameAnimation>
  );
}
