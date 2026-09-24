import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

export default function GameStatus({ state, error }) {
  const phaseLabel =
    {
      bidding: "Auction",
      "trump-selection": "Trump selection",
      "trick-play": "Trick play",
      "hand-complete": "Hand complete",
      "game-complete": "Game complete",
    }[state.phase] || state.phase;
  const animationKey = useGameAnimation(
    `${state.handNumber || 0}:${state.phase || ""}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="phase"
      className="twenty-nine-status-row"
    >
      <span>{phaseLabel}</span>
      {error ? (
        <span className="is-error">{error}</span>
      ) : (
        <span>Hand {state.handNumber}</span>
      )}
    </GameAnimation>
  );
}
