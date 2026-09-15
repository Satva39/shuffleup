import assert from "node:assert/strict";
import {
    createDeck,
    createGame,
    dealDeck,
    getLegalMoves,
    getPrivateState,
    getPublicState,
    passTurn,
    playCard,
    shuffleDeck,
} from "./sattePeSattaEngine.js";
import { RANKS, STARTER_CARD_ID } from "./sattePeSattaRules.js";

const players = ["p1", "p2", "p3", "p4"].map((id, seat) => ({
    id,
    username: id,
    seat,
    ready: true,
    connected: true,
    socketId: null,
}));

function assertUniqueCards(cards) {
    assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
}

const deck = createDeck();
assert.equal(deck.length, 52);
assertUniqueCards(deck);
assert.deepEqual([...new Set(deck.map((card) => card.suit))].sort(), ["clubs", "diamonds", "hearts", "spades"]);
assert.deepEqual([...new Set(deck.map((card) => card.rank))], RANKS);

const deal = dealDeck(deck, players);
assert.equal([...deal.values()].reduce((sum, hand) => sum + hand.length, 0), 52);
assert.deepEqual([...deal.values()].map((hand) => hand.length), [13, 13, 13, 13]);

const shuffled = shuffleDeck(deck, () => 0.5);
assert.equal(shuffled.length, 52);
assertUniqueCards(shuffled);

const room = { code: "TEST13", gameId: "satte-pe-satta", players };
const game = createGame(room);
assert.equal(game.status, "playing");
assert.equal(game.layout.hearts.cards[0].id, STARTER_CARD_ID);
assert.equal(game.layout.hearts.cards.length, 1);
assert.equal(game.players.reduce((sum, player) => sum + player.hand.length, 0) + 1, 52);
assert.ok(game.currentPlayerId);

const starter = game.players.find((player) => player.id !== game.currentPlayerId && game.layout.hearts.cards[0].id === STARTER_CARD_ID);
assert.ok(starter);
const turnPlayer = game.currentPlayerId;
const legalAtStart = getLegalMoves(game, turnPlayer);
assert.equal(legalAtStart.every((card) => card.rank === "7" || ["6-hearts", "8-hearts"].includes(card.id)), true);

const legalCard = legalAtStart[0];
const beforeCount = game.players.find((player) => player.id === turnPlayer).hand.length;
const played = playCard(game, turnPlayer, legalCard.id);
assert.equal(played.type, "play");
assert.equal(game.players.find((player) => player.id === turnPlayer).hand.length, beforeCount - 1);
assert.ok(game.layout[legalCard.suit].cards.some((card) => card.id === legalCard.id));
assert.notEqual(game.currentPlayerId, turnPlayer);

assert.throws(() => playCard(game, turnPlayer, legalAtStart.find((card) => card.id !== legalCard.id)?.id || legalCard.id), /not your turn/);

const blocked = {
    ...createGame(room),
    players: createGame(room).players,
};
blocked.currentPlayerId = blocked.players[0].id;
blocked.players[0].hand = [{ id: "K-spades", rank: "K", suit: "spades", value: 13 }];
blocked.players[0].hand = blocked.players[0].hand.filter((card) => card.id !== STARTER_CARD_ID);
blocked.layout.spades.opened = true;
blocked.layout.spades.lowest = { id: "7-spades", rank: "7", suit: "spades", value: 7 };
blocked.layout.spades.highest = { id: "7-spades", rank: "7", suit: "spades", value: 7 };
blocked.layout.spades.cards = [{ id: "7-spades", rank: "7", suit: "spades", value: 7 }];
assert.equal(getLegalMoves(blocked, blocked.currentPlayerId).length, 0);
const passed = passTurn(blocked, blocked.currentPlayerId);
assert.equal(passed.type, "pass");

const publicState = getPublicState(game);
assert.ok(publicState.players.every((player) => !Object.prototype.hasOwnProperty.call(player, "hand")));
const privateState = getPrivateState(game, turnPlayer);
assert.ok(Array.isArray(privateState.me.hand));
assert.ok(Array.isArray(privateState.me.legalMoves));

console.log("✓ Satte Pe Satta engine tests passed");
