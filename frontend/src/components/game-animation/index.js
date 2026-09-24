export { default as GameAnimation } from "./GameAnimation";
export { MOTION_VARIANTS } from "./GameAnimation";

export function createMotionTrigger(...parts) {
  return parts.map((part) => String(part ?? "")).join(":");
}
