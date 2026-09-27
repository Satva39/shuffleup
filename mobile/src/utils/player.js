export function isBotPlayer(player) {
  return Boolean(
    player?.isBot ||
    String(player?.id || "").startsWith("bot:") ||
    String(player?.username || "").startsWith("Bot "),
  );
}
