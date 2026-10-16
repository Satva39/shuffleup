const HISTORY_PREFIX = "shuffleup:game-history:";
const MAX_GAMES = 15;

function storageKey(userId) {
  return `${HISTORY_PREFIX}${String(userId || "guest")}`;
}

export function getGameHistory(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(userId)) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function recordGamePlayed(userId, gameId, now = Date.now()) {
  if (!gameId || typeof localStorage === "undefined") return;
  const history = getGameHistory(userId);
  const previous = history[gameId] || { plays: 0, lastPlayedAt: 0 };
  history[gameId] = {
    plays: Math.max(0, Number(previous.plays) || 0) + 1,
    lastPlayedAt: now,
  };

  const ordered = Object.entries(history)
    .sort((a, b) => (Number(b[1]?.lastPlayedAt) || 0) - (Number(a[1]?.lastPlayedAt) || 0))
    .slice(0, MAX_GAMES);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(Object.fromEntries(ordered)));
  } catch {
    // Storage can be disabled or full; gameplay must not depend on analytics.
  }
}
