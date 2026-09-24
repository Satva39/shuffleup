import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";

export default function TurnIndicator({ state }) {
  const player = state.players?.find(
    (item) => item.id === state.currentPlayerId,
  );
  const animationKey = useGameAnimation(
    `${state.currentPlayerId || "none"}:${state.phase || "none"}`,
  );
  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className={`twenty-nine-turn ${state.isMyTurn ? "is-mine" : ""}`}
    >
      {state.isMyTurn ? "Your turn" : `${player?.username || "Player"}'s turn`}
    </GameAnimation>
  );
}
