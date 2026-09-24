import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

function RoundInfo({ round, totalRounds, cardsPerPlayer }) {
  const animationKey = useGameAnimation(`${round}:${cardsPerPlayer}`);
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="round"
      className="kachuful-info-block"
    >
      <span className="kachuful-eyebrow">ROUND</span>
      <strong>
        {round} <small>/ {totalRounds}</small>
      </strong>
      <span className="kachuful-info-note">{cardsPerPlayer} cards each</span>
    </GameAnimation>
  );
}

export default RoundInfo;
