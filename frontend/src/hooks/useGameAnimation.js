import { useEffect, useRef, useState } from "react";

/**
 * Returns a stable animation key that increments when the supplied trigger
 * changes. Consumers can use it as a React `key` when a one-shot CSS motion
 * needs to replay for a new server-confirmed state.
 */
export function useGameAnimation(trigger, enabled = true) {
  const previousTriggerRef = useRef(trigger);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (Object.is(previousTriggerRef.current, trigger)) return;

    previousTriggerRef.current = trigger;
    setAnimationKey((currentKey) => currentKey + 1);
  }, [trigger, enabled]);

  return animationKey;
}
