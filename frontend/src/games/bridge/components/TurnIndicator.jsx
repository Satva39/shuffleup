import GameAnimation from "../../../components/game-animation/GameAnimation";
import { useGameAnimation } from "../../../hooks/useGameAnimation";
import { SEAT_LABELS } from "../logic/gameState";

export default function TurnIndicator({ state }) {
  const mine = state.turnActorId === state.you.id;
  const actor = mine
    ? "Your action"
    : `${SEAT_LABELS[state.currentSeat] || state.currentSeat}'s action`;
  const animationKey = useGameAnimation(
    `${state.turnActorId || "none"}:${state.currentSeat || "none"}:${state.phase || "none"}`,
  );

  return (
    <GameAnimation
      as="div"
      key={animationKey}
      variant="turn"
      className="bridge-turn-indicator"
    >
      <span>TURN</span>
      <strong>{actor}</strong>
    </GameAnimation>
  );
}
