import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function phaseLabel(phase) {
  if (phase === "bidding") return "Bidding";
  if (phase === "trick-play") return "Trick play";
  if (phase === "hand-complete") return "Hand complete";
  if (phase === "game-complete") return "Game complete";
  return phase;
}

export default function GameStatus({ phase, handNumber, targetScore }) {
  const animationKey = useGameAnimation(`${handNumber}:${phase}`);
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="phase"
      className="spades-game-status"
    >
      <span className="status-chip status-chip-live">
        <i /> Live
      </span>
      <span>Hand {handNumber}</span>
      <span>{phaseLabel(phase)}</span>
      <span>First to {targetScore}</span>
    </GameAnimation>
  );
}
