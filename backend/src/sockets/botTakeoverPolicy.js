/** Pure policy kept separate from socket timers so takeover eligibility is testable. */
export function canTakeOverDisconnectedPlayer(room, player) {
  if (!room || !player) return false;
  if (player.connected !== false || player.isBot === true || !player.id) return false;
  if (room.status !== "playing" || room.gameId === "solitaire") return false;
  // Demo and disclosed challenge rooms have distinct lifecycle/rules and must not
  // silently turn into standard multiplayer takeover sessions.
  if (room.mode === "demo" || room.mode === "impossible-challenge") return false;
  return true;
}

/**
 * During takeover, the game-specific bot join uses the player's existing seat ID
 * as a synthetic socket ID. A real Socket.IO connection always has its own socket
 * ID. Do not mistake the bot's successful engine join for a human reconnect.
 */
export function hasLiveHumanSocket(player) {
  return Boolean(
    player &&
      player.connected === true &&
      player.socketId &&
      String(player.socketId) !== String(player.id),
  );
}

export function takeoverGracePeriodMs(value = process.env.BOT_TAKEOVER_GRACE_MS) {
  const parsed = Number(value || 45000);
  return Number.isFinite(parsed) ? Math.min(180000, Math.max(10000, Math.floor(parsed))) : 45000;
}
