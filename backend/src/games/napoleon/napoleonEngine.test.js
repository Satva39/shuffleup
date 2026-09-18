import assert from "node:assert/strict";

import {
  createDeck,
  createGame,
  startGame,
  submitBid,
  choosePartnerCard,
  takeBlindAndDiscard,
  getPublicState,
} from "./napoleonEngine.js";

import {
  PLAYER_COUNT,
  MIN_BID,
  MAX_BID,
  determineTrickWinner,
  canPlayCard,
  calculateTeamResult,
  calculateScoreDeltas,
} from "./napoleonRules.js";

function room() {
  return {
    code: "TEST01",
    players: Array.from({ length: PLAYER_COUNT }, (_, index) => ({
      id: `p${index + 1}`,
      username: `Player${index + 1}`,
      connected: true,
    })),
  };
}

function testDeck() {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((card) => card.id)).size, 52);
}

function testGameStart() {
  const game = createGame(room());
  startGame(game);

  assert.equal(game.players.length, PLAYER_COUNT);
  assert.equal(game.phase, "bidding");
  assert.equal(game.blind.length, 2);
  assert.equal(
    game.players.reduce((sum, player) => sum + player.cards.length, 0),
    50,
  );
}

function testBidding() {
  const game = createGame(room());
  startGame(game);

  const firstPlayerId = game.players[1].id;

  submitBid(game, firstPlayerId, {
    amount: MIN_BID,
    suit: "clubs",
  });

  assert.equal(game.highestBid.amount, MIN_BID);

  const secondId = game.currentPlayerIndex;
  const secondPlayer = game.players[secondId];

  submitBid(game, secondPlayer.id, "pass");

  assert.equal(game.phase, "bidding");
  assert.equal(game.highestBid.amount, MIN_BID);

  // A non-passed bidder may bid again.
  const current = game.players[game.currentPlayerIndex];
  if (current.id === firstPlayerId) {
    submitBid(game, current.id, {
      amount: MIN_BID + 1,
      suit: "clubs",
    });
    assert.equal(game.highestBid.amount, MIN_BID + 1);
  }
}

function testTrickRules() {
  const trick = [
    {
      playerId: "a",
      card: { id: "hearts-A", suit: "hearts", rank: "A" },
    },
    {
      playerId: "b",
      card: { id: "diamonds-2", suit: "diamonds", rank: "2" },
    },
    {
      playerId: "c",
      card: { id: "hearts-Q", suit: "hearts", rank: "Q" },
    },
    {
      playerId: "d",
      card: { id: "hearts-10", suit: "hearts", rank: "10" },
    },
    {
      playerId: "e",
      card: { id: "hearts-K", suit: "hearts", rank: "K" },
    },
  ];

  assert.equal(determineTrickWinner(trick, "diamonds", 1), "a");

  const specialTrick = [
    {
      playerId: "a",
      card: { id: "spades-A", suit: "spades", rank: "A" },
    },
    {
      playerId: "b",
      card: { id: "hearts-A", suit: "hearts", rank: "A" },
    },
    {
      playerId: "c",
      card: { id: "hearts-2", suit: "hearts", rank: "2" },
    },
    {
      playerId: "d",
      card: { id: "hearts-J", suit: "hearts", rank: "J" },
    },
    {
      playerId: "e",
      card: { id: "hearts-Q", suit: "hearts", rank: "Q" },
    },
  ];

  // Diamonds are trump. Spades A remains the Mighty.
  assert.equal(determineTrickWinner(specialTrick, "diamonds", 2), "a");
}

function testFollowSuit() {
  const cards = [
    { id: "spades-8", suit: "spades", rank: "8" },
    { id: "hearts-4", suit: "hearts", rank: "4" },
  ];

  const trick = [
    {
      playerId: "lead",
      card: {
        id: "spades-5",
        suit: "spades",
        rank: "5",
      },
    },
  ];

  assert.equal(canPlayCard(cards, "hearts-4", trick, "clubs", 1).valid, false);

  assert.equal(canPlayCard(cards, "spades-8", trick, "clubs", 1).valid, true);
}

function testPrivateState() {
  const game = createGame(room());
  startGame(game);

  const viewer = game.players[0].id;
  const state = getPublicState(game, viewer);

  assert.equal(state.yourCards.length, 10);
  assert.equal(state.yourBlind.length, 0);
  assert.equal(state.players[1].cards, undefined);
  assert.equal(state.blind, undefined);
}

function testContractFlow() {
  const game = createGame(room());
  startGame(game);

  const bidderId = game.players[game.currentPlayerIndex].id;

  submitBid(game, bidderId, {
    amount: MAX_BID,
    suit: "spades",
  });

  while (game.phase === "bidding") {
    const current = game.players[game.currentPlayerIndex];
    if (current.id === bidderId) {
      throw new Error("Auction did not advance after the bid.");
    }

    submitBid(game, current.id, "pass");
  }

  assert.equal(game.phase, "contract");

  const napoleon = game.napoleonId;

  choosePartnerCard(game, napoleon, {
    rank: "A",
    suit: "spades",
  });

  assert.equal(game.phase, "blind");

  const privateState = getPublicState(game, napoleon);
  assert.equal(privateState.yourBlind.length, 2);

  const combined = [...privateState.yourCards, ...privateState.yourBlind];

  takeBlindAndDiscard(
    game,
    napoleon,
    combined.slice(0, 2).map((card) => card.id),
  );

  assert.equal(game.phase, "playing");
}

function testContractScoringRules() {
  // Standard ShuffleUp Japanese-Napoleon variant: bids 11–19 use the
  // Siberian rule, while a 20 bid requires all 20 scoring points.
  assert.deepEqual(calculateTeamResult(11, 11), { success: true, target: 11 });
  assert.deepEqual(calculateTeamResult(19, 11), { success: true, target: 11 });
  assert.deepEqual(calculateTeamResult(20, 11), { success: false, target: 11 });
  assert.deepEqual(calculateTeamResult(20, 20), { success: true, target: 20 });
  assert.deepEqual(calculateTeamResult(19, 20), { success: false, target: 20 });

  const players = Array.from({ length: 5 }, (_, index) => ({
    id: `p${index + 1}`,
  }));
  assert.deepEqual(
    calculateScoreDeltas({
      success: true,
      bidAmount: 11,
      napoleonId: "p1",
      partnerId: "p2",
      players,
    }),
    { p1: 2, p2: 1, p3: -1, p4: -1, p5: -1 },
  );
  assert.deepEqual(
    calculateScoreDeltas({
      success: true,
      bidAmount: 20,
      napoleonId: "p1",
      partnerId: "p2",
      players,
    }),
    { p1: 4, p2: 2, p3: -2, p4: -2, p5: -2 },
  );
}

function testRoundStateReset() {
  const game = createGame(room());
  startGame(game);
  game.roundResult = { success: true };
  game.players[0].roundPoints = 7;
  game.players[0].tricksWon = 3;
  game.round = 2;

  // startGame/dealRound must create a clean new round state.
  startGame(game);
  assert.equal(game.roundResult, null);
  assert.equal(game.players[0].roundPoints, 0);
  assert.equal(game.players[0].tricksWon, 0);
  assert.equal(game.players[0].cards.length, 10);
  assert.equal(game.blind.length, 2);
}

testDeck();
testGameStart();
testBidding();
testTrickRules();
testFollowSuit();
testPrivateState();
testContractFlow();
testContractScoringRules();
testRoundStateReset();

console.log("✓ Napoleon engine rules/state test passed");
