import assert from "node:assert/strict";
import {
    createDeck,
    createJackThiefGame,
    drawCard,
    inspectGame,
    startJackThief,
} from "./jackThiefEngine.js";

function room(count) {
    return {
        code: "TEST01",
        gameId: "jack-thief",
        players: Array.from({ length: count }, (_, index) => ({
            id: `p${index + 1}`,
            username: `Player${index + 1}`,
            connected: true,
            socketId: `s${index + 1}`,
        })),
    };
}

const deck = createDeck();
assert.equal(deck.length, 51);
assert.equal(deck.some((card) => card.id === "JH"), false);
assert.equal(new Set(deck.map((card) => card.id)).size, 51);

for (const count of [2, 3, 4, 6, 8, 10, 12]) {
    const game = createJackThiefGame(room(count));
    startJackThief(game);
    assert.equal(game.status, "playing");
    assert.equal(game.started, true);
    assert.equal(game.players.length, count);
    const totalCards = game.players.reduce((sum, player) => sum + player.cards.length, 0);
    assert.ok(totalCards <= 51);
    assert.ok(game.players.every((player) => player.cards.every((card) => card.id !== "JH")));
}

const game = createJackThiefGame(room(2));
startJackThief(game);
const actorId = game.currentPlayerId;
const actorIndex = game.players.findIndex((player) => player.id === actorId);
const targetIndex = (actorIndex + 1) % game.players.length;
const target = game.players[targetIndex];
assert.equal(game.players[actorIndex].id, game.currentPlayerId);
assert.ok(target.cards.length > 0);

const before = game.players.reduce((sum, player) => sum + player.cards.length, 0);
const result = drawCard(game, actorId, target.id, 0);
const after = game.players.reduce((sum, player) => sum + player.cards.length, 0);
assert.equal(after, before - (result.formedPairs.length * 2));
assert.equal(inspectGame(game).roomCode, "TEST01");
console.log("✓ Jack Thief deck, player-count, privacy-state foundation and draw flow tests passed");
