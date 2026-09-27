import { BotSocket } from "./botSocket.js";
import { decideBotAction } from "./botStrategies.js";

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

const GAME_ADAPTERS = Object.freeze({
  kachuful: {
    setup: setupKachufulSocket,
    joinEvent: "kachuful:join",
    stateEvent: "kachuful:state",
  },
  "teen-patti": {
    setup: setupTeenPattiSocket,
    joinEvent: "teen-patti:join",
    stateEvent: "teen-patti:state",
  },
  "indian-rummy": {
    setup: setupIndianRummySocket,
    joinEvent: "indian-rummy:join",
    stateEvent: "indian-rummy:state",
  },
  mangoose: {
    setup: setupMangooseSocket,
    joinEvent: "mangoose:join",
    stateEvent: "mangoose:state",
  },
  uno: {
    setup: setupUnoSocket,
    joinEvent: "uno:join",
    stateEvent: "uno:state",
  },
  "jack-thief": {
    setup: setupJackThiefSocket,
    joinEvent: "jack-thief:join",
    stateEvent: "jack-thief:state",
  },
  napoleon: {
    setup: setupNapoleonSocket,
    joinEvent: "napoleon:join",
    stateEvent: "napoleon:state",
  },
  bridge: {
    setup: setupBridgeSocket,
    joinEvent: "bridge:join",
    stateEvent: "bridge:state",
  },
  spades: {
    setup: setupSpadesSocket,
    joinEvent: "spades:join",
    stateEvent: "spades:state",
  },
  "twenty-nine": {
    setup: setupTwentyNineSocket,
    joinEvent: "twenty-nine:join",
    stateEvent: "twenty-nine:state",
  },
  "mindi-coat": {
    setup: setupMindiCoatSocket,
    joinEvent: "mindi-coat:join",
    stateEvent: "mindi-coat:state",
  },
  bluff: {
    setup: setupBluffSocket,
    joinEvent: "bluff:join",
    stateEvent: "bluff:state",
  },
  "satte-pe-satta": {
    setup: setupSattePeSattaSocket,
    joinEvent: "satte-pe-satta:join",
    stateEvent: "satte-pe-satta:state",
  },
  war: {
    setup: setupWarSocket,
    joinEvent: "war:join",
    stateEvent: "war:state",
  },
});

const sessions = new Map();

function roomKey(roomCode) {
  return String(roomCode).toUpperCase();
}

function createIoProxy(realIo, botSockets, roomCode) {
  const room = roomKey(roomCode);
  const realSocketsProxy = new Proxy(realIo.sockets, {
    get(target, property, receiver) {
      if (property === "sockets") {
        return {
          get(id) {
            return botSockets.get(id) || target.sockets.get(id);
          },
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });

  return new Proxy(realIo, {
    get(target, property, receiver) {
      if (property === "sockets") return realSocketsProxy;
      if (property !== "to") return Reflect.get(target, property, receiver);

      return (targetId) => {
        const destination = String(targetId);
        if (botSockets.has(destination)) {
          return {
            emit(event, payload) {
              botSockets.get(destination)?.receiveServerEvent(event, payload);
            },
          };
        }

        const emitter = target.to(targetId);
        return {
          emit(event, payload) {
            emitter.emit(event, payload);
            if (destination.toUpperCase() === room) {
              for (const botSocket of botSockets.values()) {
                botSocket.receiveServerEvent(event, payload);
              }
            }
          },
        };
      };
    },
  });
}

function installBotSocketHandlers(session, bot) {
  const adapter = GAME_ADAPTERS[session.gameId];
  if (!adapter)
    throw new Error(`Bots are not supported for ${session.gameId}.`);

  adapter.setup(session.io, bot, {
    getRoom: session.getRoom,
    updatePlayerSocket: session.updatePlayerSocket,
  });

  bot.onServer(adapter.stateEvent, (state) => {
    session.latestStates.set(bot.id, state);
    session.scheduleDecision(bot);
  });
}

class BotSession {
  constructor({ io, getRoom, updatePlayerSocket, room }) {
    this.realIo = io;
    this.getRoom = getRoom;
    this.updatePlayerSocket = updatePlayerSocket;
    this.room = room;
    this.roomCode = roomKey(room.code);
    this.gameId = room.gameId;
    this.adapter = GAME_ADAPTERS[this.gameId];
    this.bots = new Map();
    this.timers = new Map();
    this.latestStates = new Map();
    this.lastDecisionKey = new Map();
    this.actionFailures = new Map();
    this.startedAt = Date.now();

    this.io = createIoProxy(io, this.bots, this.roomCode);
  }

  addBot(identity) {
    const bot = new BotSocket({
      id: identity.id,
      userId: identity.id,
      username: identity.username,
      roomCode: this.roomCode,
    });
    this.bots.set(bot.id, bot);
    installBotSocketHandlers(this, bot);
    return bot;
  }

  async joinBots() {
    for (const bot of this.bots.values()) {
      const response = await bot.clientEmit(this.adapter.joinEvent, {
        roomCode: this.roomCode,
        userId: bot.id,
      });
      if (!response?.success) {
        throw new Error(
          response?.message ||
            `${bot.data.authUsername} could not join the bot game.`,
        );
      }
    }
  }

  scheduleDecision(bot) {
    const state = this.latestStates.get(bot.id);
    if (!state || this.isGameComplete(state)) return;

    const action = decideBotAction(this.gameId, state, bot.id);
    if (!action) return;

    const decisionKey = JSON.stringify({
      event: action.event,
      phase: state.phase,
      status: state.status,
      currentPlayerId: state.currentPlayerId,
      turnActorId: state.turnActorId,
      round: state.round,
      handNumber: state.handNumber,
      turnNumber: state.turnNumber,
      bid: state.yourBid,
      legal: state.legalActions,
      cards:
        state.yourCards?.length ||
        state.hand?.length ||
        state.myHand?.length ||
        state.cards?.length ||
        0,
    });

    if (
      this.lastDecisionKey.get(bot.id) === decisionKey &&
      this.timers.has(bot.id)
    )
      return;
    if (this.lastDecisionKey.get(bot.id) === decisionKey) return;

    this.lastDecisionKey.set(bot.id, decisionKey);
    this.clearTimer(bot.id);

    const minDelay =
      this.startedAt > 0 && Date.now() - this.startedAt < 2200 ? 1100 : 550;
    const delay = minDelay + Math.floor(Math.random() * 850);
    const timer = setTimeout(() => {
      this.timers.delete(bot.id);
      this.executeDecision(bot, action).catch((error) => {
        console.error(`[BOT ${bot.data.authUsername}] decision error:`, error);
        this.recoverFromFailure(bot, state);
      });
    }, delay);
    this.timers.set(bot.id, timer);
  }

  async executeDecision(bot, action) {
    const response = await bot.clientEmit(action.event, action.payload);
    if (response?.success) {
      this.actionFailures.delete(bot.id);
      return;
    }
    throw new Error(response?.message || "Bot action rejected.");
  }

  recoverFromFailure(bot, state) {
    const key = bot.id;
    const count = this.actionFailures.get(key) || 0;
    if (count >= 3) {
      // Re-arm from a refreshed state rather than hammering the same action.
      this.actionFailures.delete(key);
      this.lastDecisionKey.delete(key);
      return;
    }
    this.actionFailures.set(key, count + 1);
    this.lastDecisionKey.delete(key);
    setTimeout(() => {
      const liveState = this.latestStates.get(bot.id) || state;
      const action = decideBotAction(this.gameId, liveState, bot.id);
      if (!action) return;
      this.clearTimer(bot.id);
      const timer = setTimeout(
        () => {
          this.timers.delete(bot.id);
          this.executeDecision(bot, action).catch(() =>
            this.recoverFromFailure(bot, liveState),
          );
        },
        450 + Math.floor(Math.random() * 650),
      );
      this.timers.set(bot.id, timer);
    }, 150);
  }

  isGameComplete(state) {
    return (
      ["complete", "game-complete", "finished"].includes(state?.status) ||
      state?.phase === "game-complete"
    );
  }

  clearTimer(botId) {
    const timer = this.timers.get(botId);
    if (timer) clearTimeout(timer);
    this.timers.delete(botId);
  }

  stop() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    for (const bot of this.bots.values()) {
      bot.clientHandlers.clear();
      bot.serverHandlers.clear();
    }
    this.bots.clear();
    this.latestStates.clear();
    this.lastDecisionKey.clear();
    this.actionFailures.clear();
  }
}

export async function startBotSession({
  io,
  getRoom,
  updatePlayerSocket,
  room,
}) {
  if (!GAME_ADAPTERS[room.gameId])
    throw new Error("Bots are not supported for this game.");
  const key = roomKey(room.code);
  if (sessions.has(key)) return sessions.get(key);

  const session = new BotSession({ io, getRoom, updatePlayerSocket, room });
  const botPlayers = room.players.filter((player) => player.isBot);
  if (!botPlayers.length) throw new Error("The bot room has no bot players.");

  for (let index = 0; index < botPlayers.length; index += 1) {
    const player = botPlayers[index];
    const identity = {
      id: player.id,
      username: player.username || `Bot Player ${index + 1}`,
    };
    session.addBot(identity);
  }

  sessions.set(key, session);
  try {
    await session.joinBots();
    return session;
  } catch (error) {
    sessions.delete(key);
    session.stop();
    throw error;
  }
}

export function getBotSession(roomCode) {
  return sessions.get(roomKey(roomCode)) || null;
}

export function stopBotSession(roomCode) {
  const key = roomKey(roomCode);
  const session = sessions.get(key);
  if (!session) return;
  session.stop();
  sessions.delete(key);
}

export function listBotSessions() {
  return [...sessions.values()];
}
