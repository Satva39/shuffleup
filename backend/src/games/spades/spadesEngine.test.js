import assert from "node:assert/strict";
import {
    createDeck,
    createSpadesGame,
    getLegalCardIds,
    getPrivateState,
    playCard,
    submitBid,
    markPlayerConnection,
} from "./spadesEngine.js";
import { applyBags, gameWinner } from "./spadesRules.js";

function makeRoom() {
    return {
        code: "TEST01",
        gameId: "spades",
        status: "playing",
        players: [
            { id: "p1", username: "North" },
            { id: "p2", username: "East" },
            { id: "p3", username: "South" },
            { id: "p4", username: "West" },
        ],
    };
}

function setupBiddingGame() {
    const game = createSpadesGame(makeRoom());
    for (const player of game.players) {
        player.connected = true;
    }
    return game;
}

function bidAll(game, values = [1, 1, 1, 1]) {
    for (const value of values) {
        submitBid(game, game.turnActorId, value);
    }
}

function setupPlayableGame() {
    const game = setupBiddingGame();
    bidAll(game);
    return game;
}

const deck = createDeck();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((card) => card.id)).size, 52);
assert.equal(new Set(deck.map((card) => `${card.rank}${card.suit}`)).size, 52);

const game = setupBiddingGame();
assert.deepEqual(game.players.map((player) => player.hand.length), [13, 13, 13, 13]);
assert.equal(game.phase, "bidding");
assert.equal(game.currentSeat, "E");

assert.throws(() => submitBid(game, game.turnActorId, -1), /0 through 13/);
assert.throws(() => submitBid(game, game.turnActorId, 14), /0 through 13/);
submitBid(game, game.turnActorId, 0);
assert.throws(() => submitBid(game, "p2", 2), /already submitted/);
submitBid(game, game.turnActorId, 2);
submitBid(game, game.turnActorId, 3);
assert.equal(game.phase, "bidding");
submitBid(game, game.turnActorId, 4);
assert.equal(game.phase, "trick-play");
assert.equal(game.currentSeat, game.leaderSeat);

const playable = setupPlayableGame();
const north = playable.players.find((player) => player.id === "p1");
const east = playable.players.find((player) => player.id === "p2");
const south = playable.players.find((player) => player.id === "p3");
const west = playable.players.find((player) => player.id === "p4");

// Follow-suit validation.
playable.currentSeat = north.seat;
playable.turnActorId = north.id;
north.hand = [
    { id: "2H", rank: "2", suit: "H" },
    { id: "AS", rank: "A", suit: "S" },
];
playable.trick = [{ playerId: east.id, seat: east.seat, card: { id: "KH", rank: "K", suit: "H" } }];
assert.throws(() => playCard(playable, north.id, "AS"), /must follow H/);
assert.deepEqual(getLegalCardIds(playable, north.id), ["2H"]);

// Spades trump a non-spade lead and highest spade wins.
playable.trick = [];
playable.spadesBroken = false;
north.hand = [{ id: "2H", rank: "2", suit: "H" }, { id: "AS", rank: "A", suit: "S" }];
east.hand = [{ id: "KH", rank: "K", suit: "H" }];
south.hand = [{ id: "QS", rank: "Q", suit: "S" }];
west.hand = [{ id: "AH", rank: "A", suit: "H" }];
playable.currentSeat = north.seat;
playable.turnActorId = north.id;
playCard(playable, north.id, "2H");
playCard(playable, east.id, "KH");
playCard(playable, south.id, "QS");
playCard(playable, west.id, "AH");
assert.equal(playable.lastTrickWinner, south.seat);
assert.equal(playable.spadesBroken, true);

// Highest card of the led suit wins without a spade.
const noTrump = setupPlayableGame();
const np = noTrump.players.find((player) => player.id === "p1");
const ep = noTrump.players.find((player) => player.id === "p2");
const sp = noTrump.players.find((player) => player.id === "p3");
const wp = noTrump.players.find((player) => player.id === "p4");
for (const player of noTrump.players) player.hand = [];
np.hand = [{ id: "10C", rank: "10", suit: "C" }];
ep.hand = [{ id: "AC", rank: "A", suit: "C" }];
sp.hand = [{ id: "KC", rank: "K", suit: "C" }];
wp.hand = [{ id: "2D", rank: "2", suit: "D" }];
noTrump.currentSeat = np.seat;
noTrump.turnActorId = np.id;
noTrump.spadesBroken = false;
playCard(noTrump, np.id, "10C");
playCard(noTrump, ep.id, "AC");
playCard(noTrump, sp.id, "KC");
playCard(noTrump, wp.id, "2D");
assert.equal(noTrump.lastTrickWinner, ep.seat);

// Ownership and out-of-turn checks.
const secure = setupPlayableGame();
const current = secure.turnActorId;
const currentPlayer = secure.players.find((player) => player.id === current);
const other = secure.players.find((player) => player.id !== current);
assert.throws(() => playCard(secure, other.id, other.hand[0].id), /not your turn/);
assert.throws(() => playCard(secure, currentPlayer.id, other.hand[0].id), /do not own/);

// Spades cannot be led before breaking when a non-spade is held.
secure.currentSeat = currentPlayer.seat;
secure.turnActorId = currentPlayer.id;
secure.trick = [];
secure.spadesBroken = false;
assert.throws(() => playCard(secure, currentPlayer.id, currentPlayer.hand.find((card) => card.suit === "S").id), /cannot be led/);

// Full 13-trick hand completes and public state never exposes other hands.
const full = setupPlayableGame();
for (const player of full.players) player.hand = [];
const allCards = createDeck();
for (let index = 0; index < allCards.length; index += 1) {
    const player = full.players[index % 4];
    player.hand.push(allCards[index]);
}
for (const player of full.players) player.hand.sort((a, b) => a.id.localeCompare(b.id));
while (full.phase === "trick-play") {
    const actor = full.players.find((player) => player.id === full.turnActorId);
    const legal = getLegalCardIds(full, actor.id);
    assert.ok(legal.length > 0);
    playCard(full, actor.id, legal[0]);
}
assert.equal(full.completedTricks.length, 13);
assert.equal(full.phase, "hand-complete");
assert.equal(full.players.reduce((sum, player) => sum + player.tricksWon, 0), 13);
assert.equal(full.players.filter((player) => player.team === "A").reduce((sum, player) => sum + player.tricksWon, 0) + full.players.filter((player) => player.team === "B").reduce((sum, player) => sum + player.tricksWon, 0), 13);

const privateOne = getPrivateState(full, "p1");
assert.equal(privateOne.hand.length, 0);
assert.ok(privateOne.players.every((player) => !("hand" in player)));

markPlayerConnection(full, "p1", false);
assert.equal(full.players.find((player) => player.id === "p1").connected, false);
markPlayerConnection(full, "p1", true, "socket-new");
assert.equal(full.players.find((player) => player.id === "p1").socketId, "socket-new");

// Scoring path: the four bids are sequentially assigned E, S, W, N.
const scored = setupBiddingGame();
bidAll(scored, [2, 0, 2, 0]);
for (const player of scored.players) player.hand = [];
const scoredDeck = createDeck();
for (let index = 0; index < scoredDeck.length; index += 1) scored.players[index % 4].hand.push(scoredDeck[index]);
for (const player of scored.players) player.hand.sort((a, b) => a.id.localeCompare(b.id));
while (scored.phase === "trick-play") {
    const actor = scored.players.find((player) => player.id === scored.turnActorId);
    const legal = getLegalCardIds(scored, actor.id);
    playCard(scored, actor.id, legal[0]);
}
assert.equal(scored.completedTricks.length, 13);
assert.equal(scored.phase, "hand-complete");
assert.ok(Number.isInteger(scored.handResult.teams.A.total));
assert.ok(Number.isInteger(scored.handResult.teams.B.total));
assert.equal(scored.players.find((player) => player.id === "p1").bid, 0);
assert.equal(scored.players.find((player) => player.id === "p3").bid, 0);
const bagPenalty = applyBags(8, 4);
assert.deepEqual(bagPenalty, { remainingBags: 2, penalty: 100 });
assert.equal(gameWinner(500, 430), "A");
assert.equal(gameWinner(500, 500), null);

console.log("✓ Spades engine test passed");
