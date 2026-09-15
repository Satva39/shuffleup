import assert from "node:assert/strict";
import {
    advanceAfterChallengeWindow,
    expireChallengeWindow,
    createBluffGame,
    getDeckForTests,
    getPrivateState,
    getPublicState,
    playCards,
    resolveChallenge,
} from "./bluffEngine.js";
import { PHASE } from "./bluffRules.js";

function room(playerCount = 4) {
    return {
        code: "TEST42",
        gameId: "bluff",
        status: "playing",
        players: Array.from({ length: playerCount }, (_, index) => ({
            id: `p${index + 1}`,
            username: `Player ${index + 1}`,
            connected: true,
            socketId: `socket-${index + 1}`,
        })),
    };
}

function handIds(player, rank) {
    return player.hand.filter((card) => card.rank === rank).map((card) => card.id);
}

const deck = getDeckForTests();
assert.equal(deck.length, 52, "deck must contain 52 cards");
assert.equal(new Set(deck.map((card) => card.id)).size, 52, "deck must not contain duplicates");

const game = createBluffGame(room(4));
assert.equal(game.players.reduce((sum, player) => sum + player.hand.length, 0), 52, "all 52 cards must be dealt");
assert.equal(new Set(game.players.flatMap((player) => player.hand.map((card) => card.id))).size, 52, "dealt cards must remain unique");
assert.equal(game.requiredRank, "A");
assert.equal(game.phase, PHASE.PLAY);

const privateState = getPrivateState(game, "p1");
const publicState = getPublicState(game);
assert.equal(privateState.hand.length, game.players[0].hand.length);
assert.equal(Object.prototype.hasOwnProperty.call(publicState.players[0], "hand"), false);
assert.equal(Object.prototype.hasOwnProperty.call(publicState, "pile"), false);

const current = game.players[0];
let ace = handIds(current, "A")[0];
if (!ace) {
    const forced = current.hand[0];
    forced.rank = "A";
    ace = forced.id;
}

playCards(game, current.id, [ace]);
assert.equal(game.phase, PHASE.CHALLENGE);
assert.equal(game.currentClaim.count, 1);
assert.equal(game.pile.length, 1);
assert.equal(game.pile[0].card.id, ace);

const timeoutGame = createBluffGame(room(2));
const timeoutPlayer = timeoutGame.players[0];
const timeoutCard = timeoutPlayer.hand[0];
playCards(timeoutGame, timeoutPlayer.id, [timeoutCard.id]);
const timeoutClaimId = timeoutGame.currentClaim.id;
const beforeExpiry = expireChallengeWindow(timeoutGame, timeoutClaimId, Date.now());
assert.equal(beforeExpiry.expired, false, "challenge must remain open before expiry");
const afterExpiry = expireChallengeWindow(timeoutGame, timeoutClaimId, timeoutGame.challengeExpiresAt);
assert.equal(afterExpiry.expired, true, "expired challenge should advance automatically");
assert.equal(timeoutGame.phase, PHASE.PLAY);
assert.equal(timeoutGame.currentPlayerId, timeoutGame.players[1].id);
assert.equal(timeoutGame.requiredRank, "2");

const challenger = game.players[1];
const result = resolveChallenge(game, challenger.id);
assert.equal(result.result, "TRUTH");
assert.deepEqual(result.revealedCards.map((card) => card.id), [ace]);
assert.equal(game.pile.length, 0);
assert.equal(game.currentPlayerId, challenger.id);
assert.equal(game.requiredRank, "2");

const claimant = game.players.find((player) => player.id === game.currentPlayerId);
const bluffCard = claimant.hand.find((card) => card.rank !== game.requiredRank);
assert.ok(bluffCard, "claimant needs a non-required-rank card for the bluff test");

playCards(game, claimant.id, [bluffCard.id]);
const bluffResult = resolveChallenge(game, game.players[2].id);
assert.equal(bluffResult.result, "BLUFF");
assert.equal(game.pile.length, 0);
assert.equal(game.currentPlayerId, claimant.id, "bluffing claimant must receive the pile and keep the turn");
assert.ok(claimant.hand.some((card) => card.id === bluffCard.id));
assert.equal(game.requiredRank, "3");

console.log("✓ Bluff engine deck, dealing, private-state, truth/bluff challenge and penalty tests passed");
