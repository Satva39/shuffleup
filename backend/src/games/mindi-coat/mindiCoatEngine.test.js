import assert from "node:assert/strict";
import {
    createDeck,
    createMindiCoatGame,
    getPrivateState,
    getPublicState,
    playCard,
    revealHukum,
    selectTrumpCard,
    shuffleDeck,
    setHandsForTests,
    startNextHand,
} from "./mindiCoatEngine.js";
import { calculateHandResult, resolveTrick } from "./mindiCoatRules.js";

function room() {
    return {
        code: "ABC123",
        gameId: "mindi-coat",
        players: [
            { id: "p1", username: "North", connected: true },
            { id: "p2", username: "East", connected: true },
            { id: "p3", username: "South", connected: true },
            { id: "p4", username: "West", connected: true },
        ],
    };
}

function card(rank, suit) {
    return { id: `${rank}${suit}`, rank, suit };
}

function freshGame() {
    const game = createMindiCoatGame(room());
    for (const player of game.players) player.hand = [];
    game.phase = "trump-select";
    game.turnActorId = "p2";
    game.currentSeat = "E";
    game.leaderSeat = "E";
    game.trumpOwnerId = "p2";
    return game;
}

const deck = createDeck();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((c) => c.id)).size, 52);
assert.equal(new Set(deck.filter((c) => c.rank === "10").map((c) => c.suit)).size, 4);

const shuffled = shuffleDeck(deck, () => 0.5);
assert.equal(shuffled.length, 52);
assert.deepEqual(new Set(shuffled.map((c) => c.id)), new Set(deck.map((c) => c.id)));

const game = createMindiCoatGame(room());
assert.equal(game.players.length, 4);
assert.deepEqual(game.players.map((p) => p.hand.length), [13, 13, 13, 13]);
assert.equal(game.players[0].team, "A");
assert.equal(game.players[2].team, "A");
assert.equal(game.players[1].team, "B");
assert.equal(game.players[3].team, "B");
assert.equal(game.phase, "trump-select");
assert.equal(game.turnActorId, "p2");

const privateBefore = getPrivateState(game, "p1");
assert.equal(privateBefore.trumpSuit, null);
assert.equal(Object.prototype.hasOwnProperty.call(privateBefore, "trumpCard"), false);
assert.equal(Object.prototype.hasOwnProperty.call(privateBefore, "hiddenTrumpCard"), false);
assert.equal(Object.prototype.hasOwnProperty.call(getPublicState(game), "trumpCard"), false);

const selector = game.players.find((p) => p.id === "p2");
const selectedCard = selector.hand.find((card) => card.suit === "D") || selector.hand[0];
selectTrumpCard(game, "p2", selectedCard.id);
assert.equal(game.phase, "trick-play");
assert.equal(game.trumpCard.id, selectedCard.id);
assert.equal(game.trumpSuit, null);
assert.equal(getPrivateState(game, "p1").trumpSuit, null);
assert.equal(getPrivateState(game, "p2").hiddenTrumpOwnedByYou, true);
assert.equal(getPrivateState(game, "p2").hand.some((c) => c.id === selectedCard.id), false);
assert.equal(getPrivateState(game, "p1").hand.some((c) => c.id === selectedCard.id), false);
assert.equal(selector.hand.some((c) => c.id === selectedCard.id), false);

// Hidden Hukum stays unavailable to the hider until another player opens it.
setHandsForTests(game, {
    p1: [card("A", "C")],
    p2: [card("K", "D")],
    p3: [card("Q", "C")],
    p4: [card("J", "H")],
});
game.trumpCard = selectedCard;
game.trumpOwnerId = "p2";
game.hukumSelectedById = "p2";
game.hukumOpenedById = null;
game.trumpSuit = null;
game.trumpRevealed = false;
game.phase = "trick-play";
game.leaderSeat = "N";
game.currentSeat = "N";
game.turnActorId = "p1";
game.trick = [];
assert.equal(getPrivateState(game, "p2").hand.some((c) => c.id === selectedCard.id), false);
assert.equal(getPrivateState(game, "p2").hiddenTrumpOwnedByYou, true);

playCard(game, "p1", "AC");
assert.equal(game.trumpRevealed, false);
assert.equal(game.currentSeat, "E");

assert.throws(() => revealHukum(game, "p2"), /cannot open it/);
// Selector cannot open it; any other player without the led suit can.
game.turnActorId = "p3";
game.currentSeat = "S";
game.hukumOpenedById = null;
game.trumpRevealed = false;
game.trumpSuit = null;
assert.throws(() => revealHukum(game, "p3"), /follow the led suit/);
game.players.find((p) => p.id === "p4").hand = [card("J", "H")];
game.turnActorId = "p4";
game.currentSeat = "W";
const revealResult = revealHukum(game, "p4");
assert.equal(game.trumpRevealed, true);
assert.equal(game.trumpSuit, selectedCard.suit);
assert.equal(revealResult.card.id, selectedCard.id);
assert.equal(game.players.find((p) => p.id === "p4").hand.some((c) => c.id === selectedCard.id), false);
assert.equal(game.players.find((p) => p.id === "p2").hand.some((c) => c.id === selectedCard.id), true);
assert.equal(getPrivateState(game, "p2").hand.some((c) => c.id === selectedCard.id), true);
assert.equal(getPrivateState(game, "p4").hand.some((c) => c.id === selectedCard.id), false);
assert.equal(getPrivateState(game, "p1").trumpCard.id, selectedCard.id);

// Follow suit must be enforced.
const followGame = freshGame();
followGame.phase = "trick-play";
followGame.turnActorId = "p1";
followGame.currentSeat = "N";
followGame.trick = [{ playerId: "p1", seat: "N", card: card("2", "C") }];
setHandsForTests(followGame, {
    p1: [card("2", "C")],
    p2: [card("A", "C"), card("3", "H")],
    p3: [],
    p4: [],
});
// Explicitly place East turn after the lead.
followGame.turnActorId = "p2";
followGame.currentSeat = "E";
assert.throws(() => playCard(followGame, "p2", "3H"), /must follow C/);

// Coat detection: all four tens is Coat; 2-2 uses tricks as tie-breaker.
const coat = calculateHandResult({ tensA: 4, tensB: 0, tricksA: 5, tricksB: 8 });
assert.equal(coat.winnerTeam, "A");
assert.equal(coat.coat, true);
assert.equal(coat.score, 2);
const tieBreak = calculateHandResult({ tensA: 2, tensB: 2, tricksA: 7, tricksB: 6 });
assert.equal(tieBreak.winnerTeam, "A");
assert.equal(tieBreak.coat, false);

// Trick winner: trump beats led suit, then rank decides.
assert.equal(resolveTrick([
    { seat: "N", playerId: "p1", card: card("A", "C") },
    { seat: "E", playerId: "p2", card: card("2", "H") },
    { seat: "S", playerId: "p3", card: card("K", "C") },
    { seat: "W", playerId: "p4", card: card("Q", "C") },
], "H").seat, "E");

// Coat + score progression.
const scoreGame = freshGame();
scoreGame.phase = "hand-complete";
scoreGame.dealer = "N";
for (const player of scoreGame.players) {
    player.tricksWon = player.team === "A" ? (player.seat === "N" ? 7 : 0) : (player.seat === "E" ? 6 : 0);
    player.tensCaptured = player.team === "A" ? 2 : 2;
}
scoreGame.handResult = { winnerTeam: "A", coat: false, score: 1 };
scoreGame.scores = { A: 1, B: 0 };
startNextHand(scoreGame, "p1");
assert.equal(scoreGame.handNumber, 2);
assert.equal(scoreGame.phase, "trump-select");
assert.deepEqual(scoreGame.scores, { A: 1, B: 0 });

console.log("✓ Mindi Coat engine deck/deal/trump/privacy/follow-suit/trick/scoring tests passed");
