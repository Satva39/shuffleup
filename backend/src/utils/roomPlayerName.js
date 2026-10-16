/** Return only the public display name already associated with a room seat. */
export function getRoomPlayerName(getRoom, roomCode, playerId) {
  if (typeof getRoom !== "function" || playerId === undefined || playerId === null) return "Player";
  const room = getRoom(roomCode);
  const player = room?.players?.find((candidate) => String(candidate.id) === String(playerId));
  const name = typeof player?.username === "string" ? player.username.trim() : "";
  return name ? name.slice(0, 64) : "Player";
}
