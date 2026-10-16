const rooms = new Map();

import { randomUUID } from "node:crypto";
import {
  GAME_IDS,
  GAME_LIMITS,
  ROOM_STATUS,
} from "../../../shared/constants/platform.js";

const BOT_NAMES = Object.freeze({
  male: [
    "Arjun",
    "Bot Max",
    "Bot Jordan",
    "Bot Chris",
    "Bot Devon",
    "Bot Drew",
    "Bot Cameron",
    "Bot Parker",
    "Bot Quinn",
    "Bot Rowan",
  ],
  female: [
    "Maya",
    "Bot Riley",
    "Bot Taylor",
    "Bot Jamie",
    "Bot Casey",
    "Bot Morgan",
    "Bot Avery",
    "Bot Reese",
    "Bot Skyler",
    "Bot Finley",
  ],
});

function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

function createRoom(gameId, player) {
  if (!GAME_LIMITS[gameId]) {
    throw new Error("Invalid game.");
  }

  let code;

  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room = {
    code,
    gameId,
    hostId: player.id,
    status: ROOM_STATUS.WAITING,
    createdAt: Date.now(),
    players: [
      {
        id: player.id,
        username: player.username,
        ready: false,
        socketId: null,
        connected: true,
      },
    ],
  };

  rooms.set(code, room);

  return room;
}

function createBotRoom(gameId, player, botCount, options = {}) {
  if (gameId === GAME_IDS.SOLITAIRE) {
    throw new Error("Solitaire cannot be played with bots.");
  }
  const mode = options.mode || "bots";
  const requestedPersona = ["male", "female", "mix"].includes(
    options.botPersona,
  )
    ? options.botPersona
    : "mix";
  if (mode === "impossible-challenge" && gameId !== GAME_IDS.WAR) {
    throw new Error(
      "Impossible Challenge is currently available only for War.",
    );
  }
  if (mode === "impossible-challenge" && Number(botCount) !== 1) {
    throw new Error("Impossible Challenge uses exactly one opponent bot.");
  }

  const limits = GAME_LIMITS[gameId];
  if (!limits) throw new Error("Invalid game.");

  const count = Number(botCount);
  if (!Number.isInteger(count))
    throw new Error("Bot count must be a whole number.");

  const minBots = Math.max(1, limits.min - 1);
  const maxBots = limits.max - 1;
  if (count < minBots || count > maxBots) {
    throw new Error(
      `This game requires ${minBots} to ${maxBots} bot${maxBots === 1 ? "" : "s"} with one human player.`,
    );
  }

  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const usedNames = new Set([player.username]);
  const players = [
    {
      id: player.id,
      username: player.username,
      ready: true,
      socketId: player.socketId || null,
      connected: true,
      isBot: false,
    },
  ];

  for (let index = 0; index < count; index += 1) {
    const persona =
      requestedPersona === "mix"
        ? index % 2 === 0
          ? "male"
          : "female"
        : requestedPersona;
    const names = BOT_NAMES[persona];
    let username = names[Math.floor(index / 2) % names.length];
    if (usedNames.has(username)) {
      let suffix = 2;
      const base = username;
      while (usedNames.has(`${base} ${suffix}`)) suffix += 1;
      username = `${base} ${suffix}`;
    }
    usedNames.add(username);
    players.push({
      id: `bot:${randomUUID()}`,
      username,
      ready: true,
      socketId: null,
      connected: true,
      isBot: true,
      botPersona: persona,
    });
  }

  // Put a bot in seat 0 so games whose existing engine assigns the first
  // seat as dealer/next-round controller can progress without changing rules.
  const humanPlayer = players[0];
  const botPlayers = players.slice(1);
  const orderedPlayers = [...botPlayers, humanPlayer];

  const room = {
    code,
    gameId,
    hostId: player.id,
    status: ROOM_STATUS.PLAYING,
    mode,
    challengeMode:
      mode === "impossible-challenge" ? "disclosed-battle-advantage" : null,
    createdAt: Date.now(),
    players: orderedPlayers,
  };

  rooms.set(code, room);
  return room;
}

function deleteRoom(code) {
  rooms.delete(String(code).toUpperCase());
}

function getRoom(code) {
  return rooms.get(
    String(code || "")
      .trim()
      .toUpperCase(),
  );
}

function findActiveRoomForPlayer(playerId) {
  if (playerId === undefined || playerId === null) return null;
  const matchingRooms = [...rooms.values()]
    .filter(
      (room) =>
        room.status !== ROOM_STATUS.COMPLETE &&
        room.status !== ROOM_STATUS.FINISHED &&
        room.players.some((player) => String(player.id) === String(playerId)),
    )
    .sort(
      (a, b) =>
        (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0),
    );
  return matchingRooms[0] || null;
}

function getLiveCounts() {
  const counts = {};
  for (const gameId of Object.values(GAME_IDS)) {
    counts[gameId] = {
      connectedPlayers: 0,
      connectedHumans: 0,
      connectedBots: 0,
      activeRooms: 0,
      waitingRooms: 0,
    };
  }

  for (const room of rooms.values()) {
    const gameCounts = counts[room.gameId];
    if (!gameCounts) continue;
    if (
      room.status === ROOM_STATUS.COMPLETE ||
      room.status === ROOM_STATUS.FINISHED
    )
      continue;
    if (room.status === ROOM_STATUS.PLAYING) gameCounts.activeRooms += 1;
    if (room.status === ROOM_STATUS.WAITING) gameCounts.waitingRooms += 1;

    for (const player of room.players) {
      if (player.connected === false) continue;
      gameCounts.connectedPlayers += 1;
      if (player.isBot) gameCounts.connectedBots += 1;
      else gameCounts.connectedHumans += 1;
    }
  }
  return { generatedAt: new Date().toISOString(), games: counts };
}

function addPlayer(code, player) {
  const room = getRoom(code);

  if (!room) {
    throw new Error("Room not found.");
  }

  // Returning players must be recognized before enforcing the lobby-only
  // join rule. Otherwise a browser refresh or mobile reconnect is rejected
  // even when the player already owns a seat in the live game.
  const existingPlayer = room.players.find((item) => item.id === player.id);
  if (existingPlayer) {
    existingPlayer.username = player.username || existingPlayer.username;
    existingPlayer.connected = true;
    return room;
  }

  if (room.status !== ROOM_STATUS.WAITING) {
    throw new Error("This game has already started.");
  }

  const limits = GAME_LIMITS[room.gameId];

  if (room.players.length >= limits.max) {
    throw new Error("Room is full.");
  }

  room.players.push({
    id: player.id,
    username: player.username,
    ready: false,
    socketId: null,
    connected: true,
  });

  return room;
}

function removePlayer(code, playerId) {
  const room = getRoom(code);

  if (!room) {
    return null;
  }

  room.players = room.players.filter((player) => player.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  return room;
}

function setPlayerReady(code, playerId, ready) {
  const room = getRoom(code);

  if (!room) {
    throw new Error("Room not found.");
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error("Player not found.");
  }

  player.ready = ready;

  return room;
}

function startRoom(code, playerId) {
  const room = getRoom(code);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.hostId !== playerId) {
    throw new Error("Only the host can start the game.");
  }

  const limits = GAME_LIMITS[room.gameId];

  if (room.players.length < limits.min) {
    throw new Error(`At least ${limits.min} players are required.`);
  }

  const allReady = room.players.every(
    (player) => player.ready || player.id === room.hostId,
  );

  if (!allReady) {
    throw new Error("Every player must be ready before starting.");
  }

  room.status = ROOM_STATUS.PLAYING;

  return room;
}

function getGameLimit(gameId) {
  return GAME_LIMITS[gameId];
}

function updatePlayerSocket(code, playerId, socketId) {
  const room = getRoom(code);

  if (!room) {
    return null;
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    return null;
  }

  player.socketId = socketId;
  player.connected = true;

  return room;
}

function markPlayerDisconnected(code, playerId, socketId) {
  const room = getRoom(code);

  if (!room) {
    return null;
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    return room;
  }

  /*
   * Do not disconnect a newer connection.
   */
  if (player.socketId && player.socketId !== socketId) {
    return room;
  }

  player.connected = false;

  return room;
}

function removeDisconnectedPlayer(code, playerId) {
  const room = getRoom(code);

  if (!room) {
    return null;
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player || player.connected) {
    return room;
  }

  room.players = room.players.filter((item) => item.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  return room;
}

export {
  createRoom,
  createBotRoom,
  deleteRoom,
  getRoom,
  findActiveRoomForPlayer,
  getLiveCounts,
  addPlayer,
  removePlayer,
  setPlayerReady,
  startRoom,
  getGameLimit,
  updatePlayerSocket,
  markPlayerDisconnected,
  removeDisconnectedPlayer,
};
