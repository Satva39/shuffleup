import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";
import { phaseLabel } from "../logic/gameState";

export default function GameStatus({ phase, handNumber, targetScore }) {
  const animationKey = useGameAnimation(`${handNumber}:${phase}`);
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="phase"
      className="mindi-status"
    >
      <span className="status-dot" />
      <div>
        <strong>{phaseLabel(phase)}</strong>
        <small>
          Hand {handNumber} · first to {targetScore}
        </small>
      </div>
    </GameAnimation>
  );
}
