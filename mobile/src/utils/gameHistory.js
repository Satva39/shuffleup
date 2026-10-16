import * as SecureStore from "expo-secure-store";

const HISTORY_PREFIX = "shuffleup:game-history:";
const MAX_GAMES = 15;

export async function getGameHistory(userId) {
  try {
    const raw = await SecureStore.getItemAsync(
      `${HISTORY_PREFIX}${String(userId || "guest")}`,
    );
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export async function recordGamePlayed(userId, gameId, now = Date.now()) {
  if (!gameId) return;
  const key = `${HISTORY_PREFIX}${String(userId || "guest")}`;
  const history = await getGameHistory(userId);
  const previous = history[gameId] || { plays: 0, lastPlayedAt: 0 };
  history[gameId] = {
    plays: Math.max(0, Number(previous.plays) || 0) + 1,
    lastPlayedAt: now,
  };
  const ordered = Object.entries(history)
    .sort(
      (a, b) =>
        (Number(b[1]?.lastPlayedAt) || 0) - (Number(a[1]?.lastPlayedAt) || 0),
    )
    .slice(0, MAX_GAMES);
  await SecureStore.setItemAsync(
    key,
    JSON.stringify(Object.fromEntries(ordered)),
  );
}
