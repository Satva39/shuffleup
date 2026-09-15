import assert from "node:assert/strict";
import {
    createDeck,
    createUnoGame,
    getPrivateGameState,
    getPublicGameState,
    applyAction,
} from "./unoEngine.js";
import { ACTIONS, COLORS, STARTING_HAND_SIZE, TYPES } from "./unoRules.js";

function room(count = 4) {
    return {
        code: "TEST01",
        gameId: "uno",
        status: "playing",
        players: Array.from({ length: count }, (_, index) => ({
            id: `p${index + 1}`,
            username: `Player${index + 1}`,
            connected: true,
            socketId: `socket-${index + 1}`,
        })),
    };
}

const deck = createDeck();
assert.equal(deck.length, 108);
assert.equal(new Set(deck.map((card) => card.id)).size, 108);
assert.equal(deck.filter((card) => card.type === TYPES.WILD).length, 4);
assert.equal(deck.filter((card) => card.type === TYPES.WILD_DRAW_FOUR).length, 4);

for (const color of COLORS) {
    assert.equal(deck.filter((card) => card.color === color && card.type === TYPES.NUMBER && card.value === 0).length, 1);
    assert.equal(deck.filter((card) => card.color === color && card.type === TYPES.NUMBER && card.value === 1).length, 2);
}

const game = createUnoGame(room(4));
assert.equal(game.players.length, 4);
assert.equal(game.players.every((player) => player.hand.length === STARTING_HAND_SIZE), true);
assert.equal(game.discardPile.length, 1);
assert.ok(COLORS.includes(game.activeColor));
assert.equal(game.drawPile.length, 108 - 4 * STARTING_HAND_SIZE - 1);

const publicState = getPublicGameState(game);
assert.equal(publicState.players[0].hand, undefined);
assert.equal(publicState.discardTop.id, game.discardPile[0].id);

const first = game.currentPlayerId;
const privateState = getPrivateGameState(game, first);
assert.equal(privateState.hand.length, STARTING_HAND_SIZE);
assert.equal(privateState.playerId, first);

const activePlayer = game.players.find((player) => player.id === first);
const playable = activePlayer.hand.find((card) => privateState.playableCardIds.includes(card.id));
if (playable) {
    const result = applyAction(game, first, ACTIONS.PLAY_CARD, { cardId: playable.id });
    assert.ok(["card-played", "round-complete", "color-required"].includes(result.type));
}

console.log("✓ UNO engine deck/state/actions test passed");


// Number cards must match by value, not merely by the shared "number" type.
{
    const testGame = {
        code: "RULE01",
        gameId: "uno",
        status: "playing",
        players: [
            { id: "a", username: "A", connected: true, socketId: "sa" },
            { id: "b", username: "B", connected: true, socketId: "sb" },
        ],
    };
    const state = createUnoGame(testGame);
    const current = state.currentPlayerId;
    const currentPlayer = state.players.find((player) => player.id === current);

    currentPlayer.hand = [
        { id: "same-value", type: TYPES.NUMBER, color: "red", value: 5 },
        { id: "different-value", type: TYPES.NUMBER, color: "blue", value: 7 },
        { id: "same-color", type: TYPES.NUMBER, color: "yellow", value: 9 },
    ];
    state.discardPile = [
        { id: "top", type: TYPES.NUMBER, color: "yellow", value: 5 },
    ];
    state.activeColor = "yellow";

    const privateRuleState = getPrivateGameState(state, current);
    assert.equal(privateRuleState.playableCardIds.includes("same-value"), true);
    assert.equal(privateRuleState.playableCardIds.includes("same-color"), true);
    assert.equal(privateRuleState.playableCardIds.includes("different-value"), false);

    let rejected = false;
    try {
        applyAction(state, current, ACTIONS.PLAY_CARD, { cardId: "different-value" });
    } catch (error) {
        rejected = /cannot be played/i.test(error.message);
    }
    assert.equal(rejected, true);
}

console.log("✓ UNO number-card matching rule test passed");
