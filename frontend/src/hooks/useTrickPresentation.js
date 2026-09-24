import { useEffect, useRef, useState } from "react";

const EMPTY_TRICK = [];

/**
 * Keeps the last server-confirmed trick visible for the collection/reset
 * transition. This remembers only information that the client has already
 * received; it never creates gameplay state.
 */
export function useTrickPresentation(
  currentTrick = EMPTY_TRICK,
  fallbackTrick = EMPTY_TRICK,
) {
  const trick = Array.isArray(currentTrick) ? currentTrick : EMPTY_TRICK;
  const fallback = Array.isArray(fallbackTrick) ? fallbackTrick : EMPTY_TRICK;
  const previousTrickRef = useRef(trick);
  const [recentTrick, setRecentTrick] = useState(EMPTY_TRICK);

  useEffect(() => {
    const previousTrick = previousTrickRef.current || EMPTY_TRICK;

    if (trick.length === 0 && previousTrick.length > 0) {
      setRecentTrick(previousTrick);
    } else if (trick.length > 0) {
      setRecentTrick(EMPTY_TRICK);
    }

    previousTrickRef.current = trick;
  }, [trick]);

  const presentedTrick =
    trick.length > 0 ? trick : recentTrick.length > 0 ? recentTrick : fallback;

  return {
    presentedTrick,
    isRecent: trick.length === 0 && presentedTrick.length > 0,
    latestPlay: presentedTrick[presentedTrick.length - 1] || null,
  };
}
