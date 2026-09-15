import assert from "node:assert/strict";
import {
    createWarGame,
    getAllCardsForTests,
    getDeckForTests,
    getPrivateState,
    getPublicState,
    playWarFaceDown,
    resolveBattle,
    resolveWar,
    startBattle,
} from "./warEngine.js";
import { PHASE, rankValue } from "./warRules.js";

function room() {
    return {
        code: "WAR123",
        gameId: "war",
        status: "playing",
        players: [
            { id: "p1", username: "Player 1", connected: true, socketId: "s1" },
            { id: "p2", username: "Player 2", connected: true, socketId: "s2" },
        ],
    };
}

const deck = getDeckForTests();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((card) => card.id)).size, 52);
assert.equal(rankValue("A") > rankValue("K"), true);
assert.equal(rankValue("2") < rankValue("3"), true);

const game = createWarGame(room(), () => 0.5);
assert.equal(game.players.length, 2);
assert.equal(game.players[0].cards.length, 26);
assert.equal(game.players[1].cards.length, 26);
assert.equal(new Set(getAllCardsForTests(game).map((card) => card.id)).size, 52);
assert.equal(getPrivateState(game, "p1").players[0].cardCount, 26);
assert.equal(Object.prototype.hasOwnProperty.call(getPrivateState(game, "p1"), "hand"), false);

const first = startBattle(game);
assert.equal(game.phase, PHASE.BATTLE_REVEAL);
assert.equal(first.length, 2);
assert.equal(game.battle.length, 2);
const firstIds = new Set(first.map((item) => item.card.id));
assert.equal(firstIds.size, 2);

const forcedTie = game.battle.find((entry) => entry.playerId === "p2");
game.battle.find((entry) => entry.playerId === "p1").card.rank = forcedTie.card.rank;
const battleResolution = resolveBattle(game);
assert.equal(battleResolution.type, "war");
assert.equal(game.phase, PHASE.WAR);

const beforeWarCount = game.battle.length;
playWarFaceDown(game);
assert.equal(game.phase, PHASE.WAR_REVEAL);
assert.equal(game.battle.length >= beforeWarCount + 2, true);

const warResolution = resolveWar(game);
assert.ok(["win", "war", "win-by-exhaustion", "draw"].includes(warResolution.type));
assert.equal(game.players.reduce((sum, player) => sum + player.cards.length, 0) + game.battle.length, 52);
assert.equal(getPublicState(game).players.every((player) => player.cardCount >= 0), true);

console.log("✓ War engine deck, dealing, reveal, War, conservation and private-state tests passed");
