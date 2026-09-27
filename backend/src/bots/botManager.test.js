import assert from "node:assert/strict";
import {
  createBotRoom,
  deleteRoom,
  getRoom,
  updatePlayerSocket,
} from "../sockets/roomManager.js";
import { BotSocket } from "./botSocket.js";
import { decideBotAction } from "./botStrategies.js";
import { startBotSession, stopBotSession } from "./botManager.js";

const GAMES = [
  "kachuful",
  "teen-patti",
  "indian-rummy",
  "mangoose",
  "uno",
  "jack-thief",
  "napoleon",
  "bridge",
  "spades",
  "twenty-nine",
  "mindi-coat",
  "bluff",
  "satte-pe-satta",
  "war",
];

function fakeIo() {
  const connected = new Map([["human-socket", { emit() {} }]]);
  return {
    sockets: { sockets: connected },
    to() {
      return { emit() {} };
    },
  };
}

function testRoomValidation() {
  assert.throws(
    () =>
      createBotRoom(
        "solitaire",
        { id: "u1", username: "Human", socketId: "human-socket" },
        1,
      ),
    /Solitaire cannot be played with bots/,
  );

  const room = createBotRoom(
    "bridge",
    { id: "u1", username: "Human", socketId: "human-socket" },
    3,
  );
  assert.equal(room.players.length, 4);
  assert.equal(room.mode, "bots");
  assert.equal(room.status, "playing");
  assert.equal(room.hostId, "u1");
  assert.equal(room.players[0].isBot, true);
  assert.equal(room.players[3].id, "u1");
  assert.equal(new Set(room.players.map((player) => player.username)).size, 4);
  deleteRoom(room.code);

  assert.throws(
    () =>
      createBotRoom(
        "bridge",
        { id: "u1", username: "Human", socketId: "human-socket" },
        2,
      ),
    /requires 3 to 3 bots/,
  );
}

function testBotSocketContract() {
  const socket = new BotSocket({
    id: "bot:test",
    userId: "bot:test",
    username: "Bot Test",
    roomCode: "ABC123",
  });
  let received = null;
  socket.on("test-action", (payload, callback) => {
    received = payload;
    callback({ success: true });
  });
  const result = awaitable(socket.clientEmit("test-action", { ok: true }));
  return result.then((value) => {
    assert.deepEqual(received, { ok: true });
    assert.deepEqual(value, { success: true });
    assert.equal(socket.data.authUserId, "bot:test");
  });
}

function awaitable(promise) {
  return promise;
}

function testRepresentativeStrategies() {
  const fixtures = {
    kachuful: {
      roomCode: "A",
      status: "bidding",
      cardsPerPlayer: 3,
      trump: { suit: "spades" },
      yourCards: [{ id: "AS", rank: "A", suit: "spades" }],
      yourBid: null,
      players: [{ id: "bot:1", bid: null }],
    },
    "teen-patti": {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      players: [{ id: "bot:1", status: "active" }],
      cards: [{ rank: "A" }, { rank: "A" }, { rank: "7" }],
    },
    "indian-rummy": {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      wildJoker: "2",
      discardTop: null,
      you: { hasDrawn: false, cards: [] },
    },
    mangoose: {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      legalActions: ["flip"],
      legalTargets: { center: [], opponents: [], canSelfDrop: false },
      openTargets: { center: [], opponents: [] },
    },
    uno: {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      legalActions: ["draw-card"],
      hand: [],
    },
    "jack-thief": {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      legalActions: ["draw-card"],
      targetPlayerId: "bot:2",
      players: [{ id: "bot:2", cardCount: 3 }],
    },
    napoleon: {
      roomCode: "A",
      status: "playing",
      phase: "bidding",
      currentPlayerId: "bot:1",
      currentBid: null,
      players: [{ id: "bot:1" }],
      yourCards: [{ id: "AS", rank: "A", suit: "spades" }],
    },
    bridge: {
      roomCode: "A",
      phase: "auction",
      currentSeat: 0,
      legalBidOptions: [{ type: "pass" }],
      players: [{ id: "bot:1", seat: 0, hand: [] }],
    },
    spades: {
      roomCode: "A",
      phase: "bidding",
      turnActorId: "bot:1",
      bidOptions: [0, 1],
      hand: [{ id: "AS", rank: "A", suit: "spades" }],
    },
    "twenty-nine": {
      roomCode: "A",
      phase: "bidding",
      isMyTurn: true,
      legalBids: ["pass"],
      myHand: [{ rank: "A", suit: "S" }],
    },
    "mindi-coat": {
      roomCode: "A",
      phase: "trump-select",
      canSelectTrump: true,
      hand: [{ id: "hukum-slot-1", hidden: true }],
    },
    bluff: {
      roomCode: "A",
      status: "playing",
      phase: "play",
      currentPlayerId: "bot:1",
      canPlay: true,
      selectableCardIds: ["AS"],
      hand: [{ id: "AS", rank: "A", suit: "spades" }],
      requiredRank: "A",
    },
    "satte-pe-satta": {
      roomCode: "A",
      status: "playing",
      currentPlayerId: "bot:1",
      me: {
        hand: [{ id: "7S", rank: "7", suit: "spades" }],
        legalMoves: ["7S"],
      },
    },
    war: { roomCode: "A", phase: "ready", status: "playing" },
  };

  for (const gameId of GAMES) {
    const action = decideBotAction(gameId, fixtures[gameId], "bot:1");
    if (gameId === "war") assert.equal(action, null);
    else
      assert.ok(
        action?.event,
        `${gameId} did not produce a representative action`,
      );
  }
}

async function smokeJoinAllGames() {
  const io = {
    sockets: { sockets: new Map() },
    to() {
      return { emit() {} };
    },
  };
  const botCounts = {
    kachuful: 3,
    "teen-patti": 2,
    "indian-rummy": 1,
    mangoose: 1,
    uno: 1,
    "jack-thief": 1,
    napoleon: 4,
    bridge: 3,
    spades: 3,
    "twenty-nine": 3,
    "mindi-coat": 3,
    bluff: 1,
    "satte-pe-satta": 2,
    war: 1,
  };

  for (const gameId of GAMES) {
    const humanId = `human-${gameId}`;
    const room = createBotRoom(
      gameId,
      { id: humanId, username: "Human", socketId: `human-${gameId}-socket` },
      botCounts[gameId],
    );
    io.sockets.sockets.set(`human-${gameId}-socket`, { emit() {} });

    const session = await startBotSession({
      io,
      getRoom,
      updatePlayerSocket,
      room,
    });

    assert.equal(
      session.bots.size,
      room.players.filter((player) => player.isBot).length,
      `${gameId} adapter bot count mismatch`,
    );
    for (const bot of session.bots.values()) {
      assert.ok(
        session.latestStates.has(bot.id),
        `${gameId} bot did not receive private state`,
      );
      assert.equal(bot.data.isBot, true);
      assert.equal(
        room.players.find((player) => player.id === bot.id)?.isBot,
        true,
      );
    }

    stopBotSession(room.code);
    deleteRoom(room.code);
  }
}

async function main() {
  testRoomValidation();
  await testBotSocketContract();
  testRepresentativeStrategies();
  await smokeJoinAllGames();
  console.log(
    "✓ Bot room validation, virtual socket contract, 14-game strategy coverage, and adapter smoke passed",
  );
}

await main();
process.exit(0);
