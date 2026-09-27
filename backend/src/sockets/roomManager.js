const rooms = new Map();

import { randomUUID } from "node:crypto";
import {
  GAME_IDS,
  GAME_LIMITS,
  ROOM_STATUS,
} from "../../../shared/constants/platform.js";

const BOT_NAMES = [
  "Bot Alex",
  "Bot Sam",
  "Bot Max",
  "Bot Riley",
  "Bot Jordan",
  "Bot Chris",
  "Bot Taylor",
  "Bot Jamie",
  "Bot Casey",
  "Bot Morgan",
  "Bot Avery",
  "Bot Quinn",
  "Bot Parker",
  "Bot Devon",
  "Bot Reese",
  "Bot Drew",
  "Bot Skyler",
  "Bot Cameron",
  "Bot Finley",
  "Bot Rowan",
];

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

function createBotRoom(gameId, player, botCount) {
  if (gameId === GAME_IDS.SOLITAIRE) {
    throw new Error("Solitaire cannot be played with bots.");
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
    let username = BOT_NAMES[index % BOT_NAMES.length];
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
    mode: "bots",
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
  return rooms.get(code.toUpperCase());
}

function addPlayer(code, player) {
  const room = getRoom(code);

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== ROOM_STATUS.WAITING) {
    throw new Error("This game has already started.");
  }

  if (room.players.some((item) => item.id === player.id)) {
    return room;
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
  addPlayer,
  removePlayer,
  setPlayerReady,
  startRoom,
  getGameLimit,
  updatePlayerSocket,
  markPlayerDisconnected,
  removeDisconnectedPlayer,
};
