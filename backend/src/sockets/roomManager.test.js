import assert from "node:assert/strict";
import {
  createRoom,
  createBotRoom,
  addPlayer,
  getRoom,
  deleteRoom,
  setPlayerReady,
  startRoom,
  findActiveRoomForPlayer,
  getLiveCounts,
} from "./roomManager.js";

const hostId = `test-host-${Date.now()}`;
const guestId = `test-guest-${Date.now()}`;
const room = createRoom("war", { id: hostId, username: "Host" });
try {
  addPlayer(room.code, { id: guestId, username: "Guest" });
  setPlayerReady(room.code, guestId, true);
  startRoom(room.code, hostId);

  // Joining again after a game starts should restore the same seat rather
  // than treating the player as a new participant or rejecting the reconnect.
  const returnedRoom = addPlayer(room.code, { id: hostId, username: "Host" });
  assert.equal(returnedRoom.code, room.code);
  assert.equal(returnedRoom.players.filter((player) => player.id === hostId).length, 1);
  assert.equal(findActiveRoomForPlayer(hostId).code, room.code);

  const counts = getLiveCounts().games.war;
  assert.equal(counts.activeRooms, 1);
  assert.equal(counts.connectedHumans, 2);
  assert.equal(counts.connectedPlayers, 2);
  console.log("Room reconnect and live-count tests passed.");
} finally {
  deleteRoom(room.code);
}

for (const persona of ["male", "female", "mix"]) {
  const botRoom = createBotRoom("war", { id: `persona-test-${persona}`, username: "Tester" }, 1, { mode: "bots", botPersona: persona });
  try {
    const selectedBot = botRoom.players.find((player) => player.isBot);
    assert.ok(selectedBot);
    assert.equal(selectedBot.botPersona, persona === "mix" ? "male" : persona);
    assert.equal(selectedBot.username, persona === "female" ? "Maya" : "Arjun");
  } finally {
    deleteRoom(botRoom.code);
  }
}
console.log("Bot persona selection tests passed.");
