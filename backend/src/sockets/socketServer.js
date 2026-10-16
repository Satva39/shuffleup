import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { setActiveSocketServer } from "./activeSocketRegistry.js";
import { canTakeOverDisconnectedPlayer, hasLiveHumanSocket, takeoverGracePeriodMs } from "./botTakeoverPolicy.js";

import {
  createRoom,
  createBotRoom,
  getRoom,
  findActiveRoomForPlayer,
  getLiveCounts,
  addPlayer,
  removePlayer,
  setPlayerReady,
  startRoom,
  updatePlayerSocket,
  markPlayerDisconnected,
  removeDisconnectedPlayer,
} from "./roomManager.js";
import {
  assertAuthenticatedSocket,
  assertRegisteredSocket,
  assertSocketPlayer,
  assertSocketRoom,
} from "./socketGuards.js";
import { deleteRoom } from "./roomManager.js";
import {
  startBotSession,
  stopBotSession,
  getBotSession,
  createBotAwareIo,
} from "../bots/botManager.js";

const botDisconnectCleanupTimers = new Map();
const botTakeoverTimers = new Map();
const demoRoomExpiryTimers = new Map();
const BOT_TAKEOVER_GRACE_MS = takeoverGracePeriodMs();

function takeoverTimerKey(roomCode, userId) {
  return `${String(roomCode).toUpperCase()}:${String(userId)}`;
}

function cancelBotTakeover(roomCode, userId) {
  const key = takeoverTimerKey(roomCode, userId);
  const timer = botTakeoverTimers.get(key);
  if (timer) clearTimeout(timer);
  botTakeoverTimers.delete(key);
}

async function startPlayerBotTakeover(io, gameIo, roomCode, userId) {
  const room = getRoom(roomCode);
  const player = room?.players?.find((item) => String(item.id) === String(userId));
  if (!canTakeOverDisconnectedPlayer(room, player)) return;

  player.isBot = true;
  player.autoBotTakeover = true;
  player.takeoverStartedAt = Date.now();
  player.botPersona = player.botPersona || "neutral";
  player.username = `${String(player.username || "Player").slice(0, 21)} · Auto Bot`;

  try {
    const existingSession = getBotSession(room.code);
    const session = existingSession || await startBotSession({ io: gameIo, getRoom, updatePlayerSocket, room });
    if (existingSession) await session.takeOverPlayer(player);
    // A reconnect may race the async engine join. If the human has already
    // returned, immediately hand control back instead of letting both act.
    if (hasLiveHumanSocket(player)) {
      session.returnControl(userId);
      if (session.bots.size === 0) stopBotSession(room.code);
      player.isBot = false;
      player.autoBotTakeover = false;
      player.takeoverStartedAt = null;
      player.username = String(player.username || "Player").replace(/ · Auto Bot$/, "");
      return;
    }
    io.to(room.code).emit("room-updated", room);
    io.to(room.code).emit("bot-takeover-started", { roomCode: room.code, userId, playerName: player.username, gracePeriodMs: BOT_TAKEOVER_GRACE_MS });
    publishLiveCounts(io);
  } catch (error) {
    player.isBot = false;
    player.autoBotTakeover = false;
    player.username = String(player.username || "Player").replace(/ · Auto Bot$/, "");
    player.connected = false;
    console.error("Automatic bot takeover failed:", error?.message || "Unknown bot takeover error.");
  }
}

function schedulePlayerBotTakeover(io, gameIo, roomCode, userId) {
  const room = getRoom(roomCode);
  const player = room?.players?.find((item) => String(item.id) === String(userId));
  if (!canTakeOverDisconnectedPlayer(room, player)) return;
  cancelBotTakeover(roomCode, userId);
  const key = takeoverTimerKey(roomCode, userId);
  const timer = setTimeout(() => {
    botTakeoverTimers.delete(key);
    void startPlayerBotTakeover(io, gameIo, roomCode, userId);
  }, BOT_TAKEOVER_GRACE_MS);
  timer.unref?.();
  botTakeoverTimers.set(key, timer);
}

function scheduleDemoRoomExpiry(io, room) {
  if (!room || room.mode !== "demo" || !room.demoExpiresAt) return;
  const key = String(room.code).toUpperCase();
  const previous = demoRoomExpiryTimers.get(key);
  if (previous) clearTimeout(previous);
  const delay = Math.max(0, Number(room.demoExpiresAt) - Date.now());
  const timer = setTimeout(() => {
    demoRoomExpiryTimers.delete(key);
    const liveRoom = getRoom(key);
    if (!liveRoom || liveRoom.mode !== "demo") return;
    // Room expiry is independent of the browser socket, so closing the app
    // cannot leave a demo room/bot session alive past the signed expiry.
    io.to(key).emit("room-expired", { roomCode: key, reason: "demo-expired" });
    io.to(key).emit("demo-expired", { message: "Your two-minute demo has ended. Sign in or register to keep playing." });
    stopBotSession(key);
    deleteRoom(key);
    publishLiveCounts(io);
  }, delay);
  timer.unref?.();
  demoRoomExpiryTimers.set(key, timer);
}

function publishLiveCounts(io) {
  io.emit("game-live-counts", getLiveCounts());
}

function getRoomDestination(room) {
  if (!room) return null;
  const code = String(room.code).toUpperCase();
  return room.status === "waiting" ? `/room/${code}` : `/games/${room.gameId}/${code}`;
}

function scheduleBotDisconnectCleanup(roomCode, userId) {
  const key = String(roomCode).toUpperCase();
  const existing = botDisconnectCleanupTimers.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    botDisconnectCleanupTimers.delete(key);
    const room = getRoom(key);
    const human = room?.players?.find((player) => player.id === userId);
    if (
      room?.mode === "bots" &&
      room.hostId === userId &&
      human?.connected === false &&
      human?.autoBotTakeover !== true
    ) {
      stopBotSession(key);
      deleteRoom(key);
    }
  }, 120000);

  botDisconnectCleanupTimers.set(key, timer);
}

import { setupKachufulSocket } from "../games/kachuful/kachufulSocket.js";

import { setupTeenPattiSocket } from "../games/teen-patti/teenPattiSocket.js";

import { setupIndianRummySocket } from "../games/indian-rummy/indianRummySocket.js";

import { setupMangooseSocket } from "../games/mangoose/mangooseSocket.js";

import { setupUnoSocket } from "../games/uno/unoSocket.js";

import { setupJackThiefSocket } from "../games/jack-thief/jackThiefSocket.js";

import { setupNapoleonSocket } from "../games/napoleon/napoleonSocket.js";

import { setupBridgeSocket } from "../games/bridge/bridgeSocket.js";

import { setupSpadesSocket } from "../games/spades/spadesSocket.js";

import { setupTwentyNineSocket } from "../games/twenty-nine/twentyNineSocket.js";

import { setupMindiCoatSocket } from "../games/mindi-coat/mindiCoatSocket.js";

import { setupBluffSocket } from "../games/bluff/bluffSocket.js";

import { setupSattePeSattaSocket } from "../games/satte-pe-satta/sattePeSattaSocket.js";

import { setupWarSocket } from "../games/war/warSocket.js";

import { setupSolitaireSocket } from "../games/solitaire/solitaireSocket.js";

function setupSocket(io) {
  setActiveSocketServer(io);
  const gameIo = createBotAwareIo(io);
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === "demo") {
        const expiresAt = Number(decoded.demoExpiresAt || Number(decoded.exp) * 1000);
        if (!String(decoded.id || "").startsWith("guest:") || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
          return next(new Error("Your two-minute demo has ended. Please sign in or register."));
        }
        socket.data.authUserId = decoded.id;
        socket.data.authUsername = decoded.username || "Guest";
        socket.data.isDemo = true;
        socket.data.demoExpiresAt = expiresAt;
        socket.data.demoExpiresTimer = null;
        return next();
      }

      const result = await pool.query(
        "SELECT email_verified, auth_version FROM users WHERE id = $1",
        [decoded.id],
      );
      const account = result.rows[0];
      if (!account || account.email_verified !== true) {
        return next(new Error("Email verification required."));
      }
      if (Number(decoded.authVersion ?? 0) !== Number(account.auth_version ?? 0)) {
        return next(new Error("Session expired. Please sign in again."));
      }

      socket.data.authUserId = decoded.id;
      socket.data.authUsername = decoded.username;
      socket.data.isDemo = false;
      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token."));
    }
  });

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    if (!socket.data.isDemo) socket.join(`auth-user:${String(socket.data.authUserId)}`);
    if (socket.data.isDemo) {
      const remaining = Math.max(0, Number(socket.data.demoExpiresAt) - Date.now());
      socket.data.demoExpiresTimer = setTimeout(() => {
        socket.emit("demo-expired", { message: "Your two-minute demo has ended. Sign in or register to keep playing." });
        socket.disconnect(true);
      }, remaining);
      socket.data.demoExpiresTimer.unref?.();
    }

    socket.onAny((eventName, payload) => {
      const roomCode = payload?.roomCode;
      const userId = payload?.userId || socket.data.authUserId;
      if (roomCode && userId && (eventName === "get-my-active-room" || eventName === "join-room" || /:(join|reconnect)$/.test(eventName))) {
        cancelBotTakeover(roomCode, userId);
        const room = getRoom(roomCode);
        const player = room?.players?.find((item) => String(item.id) === String(userId));
        if (player?.autoBotTakeover) {
          const session = getBotSession(roomCode);
          session?.returnControl(userId);
          player.isBot = false;
          player.autoBotTakeover = false;
          player.takeoverStartedAt = null;
          player.username = String(player.username || "Player").replace(/ · Auto Bot$/, "");
          player.connected = true;
        }
      }
      if (socket.data.isDemo && Date.now() >= Number(socket.data.demoExpiresAt || 0)) {
        socket.emit("demo-expired", { message: "Your two-minute demo has ended. Sign in or register to keep playing." });
        socket.disconnect(true);
        return;
      }
      if (socket.data.isDemo && typeof eventName === "string" && /^(create-room|join-room|toggle-ready|start-game)$/.test(eventName)) {
        socket.emit("demo-restricted", { message: "Demo sessions can only play supported bot games. Sign in for multiplayer rooms." });
        return;
      }
      if (roomCode && typeof eventName === "string" && /:(action|play|play-card|move|bid|discard|draw|claim|challenge|pass|call|advance)$/.test(eventName)) {
        const room = getRoom(roomCode);
        if (room && ["bots", "demo", "impossible-challenge"].includes(room.mode)) {
          const actorId = payload?.userId || payload?.playerId || socket.data.authUserId;
          if (String(actorId) === String(socket.data.authUserId) && !String(actorId).startsWith("bot:")) {
            room.pendingBotAction = { actorId: String(actorId), actionEvent: eventName, at: Date.now() };
          }
        }
      }
    });
    socket.emit("game-live-counts", getLiveCounts());

    socket.on("get-live-counts", (callback) => {
      const counts = getLiveCounts();
      if (typeof callback === "function") callback({ success: true, ...counts });
      else socket.emit("game-live-counts", counts);
    });

    // Recover an existing room seat after navigation, refresh or reconnect.
    // The game-specific join event is still responsible for restoring the
    // private, authoritative hand/state after this metadata step.
    socket.on("get-my-active-room", (payloadOrCallback, maybeCallback) => {
      const callback = typeof payloadOrCallback === "function" ? payloadOrCallback : maybeCallback;
      try {
        const userId = assertAuthenticatedSocket(socket);
        const room = findActiveRoomForPlayer(userId);
        if (!room) {
          callback?.({ success: true, room: null });
          return;
        }

        const player = room.players.find((item) => String(item.id) === String(userId));
        if (!player) {
          callback?.({ success: true, room: null });
          return;
        }

        const priorSocketId = player.socketId;
        if (player.autoBotTakeover) {
          getBotSession(room.code)?.returnControl(userId);
          player.isBot = false;
          player.autoBotTakeover = false;
          player.takeoverStartedAt = null;
          player.username = String(player.username || "Player").replace(/ · Auto Bot$/, "");
        }
        updatePlayerSocket(room.code, userId, socket.id);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.userId = userId;

        // Make the most recent recovery connection authoritative so an old
        // tab cannot keep submitting actions for the same seat.
        if (priorSocketId && priorSocketId !== socket.id) {
          const priorSocket = io.sockets.sockets.get(priorSocketId);
          if (priorSocket && priorSocket !== socket) {
            priorSocket.emit("session-replaced", { roomCode: room.code });
            priorSocket.disconnect(true);
          }
        }

        const cleanupTimer = botDisconnectCleanupTimers.get(room.code);
        if (cleanupTimer) {
          clearTimeout(cleanupTimer);
          botDisconnectCleanupTimers.delete(room.code);
        }
        publishLiveCounts(io);
        callback?.({
          success: true,
          room: { code: room.code, gameId: room.gameId, status: room.status, mode: room.mode || "multiplayer" },
          destination: getRoomDestination(room),
        });
        io.to(room.code).emit("room-updated", room);
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    setupKachufulSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupTeenPattiSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupIndianRummySocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupMangooseSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupUnoSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupJackThiefSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupNapoleonSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupBridgeSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupSpadesSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupTwentyNineSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupMindiCoatSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupBluffSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupSattePeSattaSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupWarSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    setupSolitaireSocket(gameIo, socket, {
      getRoom,
      updatePlayerSocket,
    });

    socket.on("create-room", ({ gameId }, callback) => {
      try {
        const userId = assertRegisteredSocket(socket);
        const username = socket.data.authUsername;

        const room = createRoom(gameId, {
          id: userId,
          username,
        });

        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.userId = userId;

        updatePlayerSocket(room.code, userId, socket.id);

        callback({
          success: true,
          room,
        });

        io.to(room.code).emit("room-updated", room);
        publishLiveCounts(io);
      } catch (error) {
        callback({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on("create-bot-game", async ({ gameId, botCount, challengeMode, botPersona }, callback) => {
      let botRoom = null;
      try {
        const userId = assertAuthenticatedSocket(socket);
        const username = socket.data.authUsername;
        if (socket.data.isDemo && challengeMode) throw new Error("Impossible Challenge requires a registered account.");
        const selectedMode = challengeMode === "impossible" ? "impossible-challenge" : (socket.data.isDemo ? "demo" : "bots");
        botRoom = createBotRoom(
          gameId,
          {
            id: userId,
            username,
            socketId: socket.id,
          },
          botCount,
          { mode: selectedMode, botPersona },
        );
        if (socket.data.isDemo) {
          botRoom.demoExpiresAt = socket.data.demoExpiresAt;
          scheduleDemoRoomExpiry(io, botRoom);
        }

        socket.join(botRoom.code);
        socket.data.roomCode = botRoom.code;
        socket.data.userId = userId;
        updatePlayerSocket(botRoom.code, userId, socket.id);

        await startBotSession({
          io: gameIo,
          getRoom,
          updatePlayerSocket,
          room: botRoom,
        });

        callback({ success: true, room: botRoom });
        io.to(botRoom.code).emit("room-updated", botRoom);
        publishLiveCounts(io);
      } catch (error) {
        if (botRoom) {
          stopBotSession(botRoom.code);
          deleteRoom(botRoom.code);
        }
        callback({ success: false, message: error.message });
      }
    });

    socket.on("join-room", ({ roomCode }, callback) => {
      try {
        const userId = assertRegisteredSocket(socket);
        const username = socket.data.authUsername;

        const room = addPlayer(roomCode, {
          id: userId,
          username,
        });

        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.userId = userId;

        updatePlayerSocket(room.code, userId, socket.id);

        callback({
          success: true,
          room,
        });

        io.to(room.code).emit("room-updated", room);
        publishLiveCounts(io);
      } catch (error) {
        callback({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on("toggle-ready", ({ roomCode }, callback) => {
      try {
        assertRegisteredSocket(socket);
        const userId = assertSocketPlayer(socket, socket.data.userId);
        assertSocketRoom(socket, roomCode);
        const room = getRoom(roomCode);

        if (!room) {
          throw new Error("Room not found.");
        }

        const player = room.players.find((item) => item.id === userId);

        if (!player) {
          throw new Error("Player not found.");
        }

        const updatedRoom = setPlayerReady(roomCode, userId, !player.ready);

        callback({
          success: true,
          room: updatedRoom,
        });

        io.to(updatedRoom.code).emit("room-updated", updatedRoom);
        publishLiveCounts(io);
      } catch (error) {
        callback({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on("start-game", ({ roomCode }, callback) => {
      try {
        assertRegisteredSocket(socket);
        const userId = assertSocketPlayer(socket, socket.data.userId);
        assertSocketRoom(socket, roomCode);
        const room = startRoom(roomCode, userId);

        callback({
          success: true,
          room,
        });

        io.to(room.code).emit("game-started", room);
        publishLiveCounts(io);
      } catch (error) {
        callback({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on("leave-room", ({ roomCode }) => {
      const userId = assertSocketPlayer(socket, socket.data.userId);
      assertSocketRoom(socket, roomCode);
      const existingRoom = getRoom(roomCode);

      if (existingRoom?.mode === "bots") {
        stopBotSession(existingRoom.code);
        deleteRoom(existingRoom.code);
        socket.leave(existingRoom.code);
        socket.data.roomCode = null;
        publishLiveCounts(io);
        return;
      }

      const room = removePlayer(roomCode, userId);
      socket.leave(roomCode);

      if (room) {
        io.to(room.code).emit("room-updated", room);
      }
      publishLiveCounts(io);
    });

    socket.on("disconnect", () => {
      if (socket.data.demoExpiresTimer) clearTimeout(socket.data.demoExpiresTimer);
      const roomCode = socket.data.roomCode;
      const userId = socket.data.userId;

      if (!roomCode || !userId) {
        console.log("Player disconnected:", socket.id);

        return;
      }

      const room = markPlayerDisconnected(roomCode, userId, socket.id);

      if (!room) {
        return;
      }

      if (room.mode === "demo") {
        io.to(room.code).emit("room-updated", room);
        publishLiveCounts(io);
        return;
      }

      io.to(room.code).emit("room-updated", room);
      publishLiveCounts(io);
      schedulePlayerBotTakeover(io, gameIo, room.code, userId);

      if (room.mode === "bots" && room.hostId === userId) {
        scheduleBotDisconnectCleanup(room.code, userId);
        return;
      }

      /*
       * Give the player a short grace period.
       * This handles normal browser refreshes/reconnections.
       */
      if (
        room.gameId === "kachuful" ||
        room.gameId === "teen-patti" ||
        room.gameId === "indian-rummy" ||
        room.gameId === "mangoose" ||
        room.gameId === "uno" ||
        room.gameId === "jack-thief" ||
        room.gameId === "napoleon" ||
        room.gameId === "bridge" ||
        room.gameId === "spades" ||
        room.gameId === "twenty-nine" ||
        room.gameId === "mindi-coat" ||
        room.gameId === "bluff" ||
        room.gameId === "satte-pe-satta" ||
        room.gameId === "war" ||
        room.gameId === "solitaire"
      ) {
        return;
      }

      setTimeout(() => {
        const updatedRoom = removeDisconnectedPlayer(roomCode, userId);

        if (updatedRoom) {
          io.to(updatedRoom.code).emit("room-updated", updatedRoom);
        }
      }, 15000);

      console.log("Player disconnected:", socket.id);
    });
  });
}

export default setupSocket;
