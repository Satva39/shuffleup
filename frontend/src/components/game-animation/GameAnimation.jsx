import { forwardRef } from "react";

export const MOTION_VARIANTS = new Set([
  "fade-in",
  "rise-in",
  "scale-in",
  "slide-in",
  "card-deal",
  "card-play",
  "card-select",
  "turn",
  "round",
  "phase",
  "trick-play",
  "trick-collection",
  "success",
  "shake",
  "collect",
]);

/**
 * Presentation-only motion primitive.
 *
 * This component deliberately renders the requested element itself so motion
 * can be added without introducing wrapper nodes that could change a game's
 * existing flex/grid/table layout.
 */
const GameAnimation = forwardRef(function GameAnimation(
  {
    as: Component = "div",
    variant = "fade-in",
    active = true,
    duration,
    delay,
    distance,
    className = "",
    children,
    style: incomingStyle,
    ...props
  },
  ref,
) {
  const safeVariant = MOTION_VARIANTS.has(variant) ? variant : "fade-in";
  const motionClass = [
    "game-motion",
    `game-motion--${safeVariant}`,
    active ? "is-active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    ...incomingStyle,
    ...(duration ? { "--game-motion-duration": duration } : {}),
    ...(delay ? { "--game-motion-delay": delay } : {}),
    ...(distance ? { "--game-motion-distance": distance } : {}),
  };

  return (
    <Component ref={ref} className={motionClass} style={style} {...props}>
      {children}
    </Component>
  );
});

export default GameAnimation;
