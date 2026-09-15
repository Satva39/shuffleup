import assert from "node:assert/strict";
import { createIndianRummyGame, validateDeclaration, applyAction, getPublicGameState, getPrivateGameState } from "./indianRummyEngine.js";

const room = {
    code: "TEST01",
    players: Array.from({ length: 6 }, (_, index) => ({
        id: `p${index + 1}`,
        username: `Player${index + 1}`,
        socketId: null,
        connected: true,
    })),
};

const game = createIndianRummyGame(room);
assert.equal(game.players.length, 6);
assert.deepEqual(game.players.map((player) => player.cards.length), [13, 13, 13, 13, 13, 13]);
assert.equal(game.drawPile.length + game.discardPile.length + game.players.reduce((n, p) => n + p.cards.length, 0), 106);
assert.equal(getPublicGameState(game).players.some((player) => Object.hasOwn(player, "cards")), false);
assert.equal(getPrivateGameState(game, "p1").you.cards.length, 13);

assert.throws(() => applyAction(game, "p2", "draw-closed"), /not your turn/i);
applyAction(game, "p1", "draw-closed");
assert.equal(game.players[0].cards.length, 14);
assert.throws(() => applyAction(game, "p1", "draw-closed"), /already drawn/i);

const discardCard = game.players[0].cards.at(-1).id;
applyAction(game, "p1", "discard", discardCard);
assert.equal(game.players[0].cards.length, 13);
assert.equal(game.currentPlayerId, "p2");

const c = (id, rank, suit, printedJoker = false) => ({
    id, rank, suit, value: rank === "A" ? 1 : ["J", "Q", "K"].includes(rank) ? 10 : Number(rank), printedJoker,
});

const winningHand = [
    c("a1", "5", "spades"), c("a2", "6", "spades"), c("a3", "7", "spades"),
    c("b1", "9", "hearts"), c("b2", "10", "hearts"), c("b3", "J", "hearts"),
    c("s1", "2", "clubs"), c("s2", "2", "diamonds"), c("s3", "2", "hearts"),
    c("c1", "4", "diamonds"), c("c2", "5", "diamonds"), c("c3", "6", "diamonds"), c("c4", "7", "diamonds"),
];
assert.equal(validateDeclaration(winningHand, "K").valid, true);

console.log("Indian Rummy engine tests passed");
