import assert from "node:assert/strict";
import {
    createDeck,
    shuffleDeck,
    createBridgeGame,
    submitBid,
    playCard,
    getPrivateState,
    markPlayerConnection,
} from "./bridgeEngine.js";
import { calculateContractScore } from "./bridgeRules.js";

function room(code = "BR1234") {
    return {
        code,
        gameId: "bridge",
        status: "playing",
        players: [
            { id: "p1", username: "North", socketId: null, connected: true },
            { id: "p2", username: "East", socketId: null, connected: true },
            { id: "p3", username: "South", socketId: null, connected: true },
            { id: "p4", username: "West", socketId: null, connected: true },
        ],
    };
}

function startContractGame({ level = 1, strain = "NT", suffix = "" } = {}) {
    const game = createBridgeGame(room(`BR${suffix || Math.floor(Math.random() * 9999)}`));
    submitBid(game, "p1", { type: "bid", level, strain });
    submitBid(game, "p2", { type: "pass" });
    submitBid(game, "p3", { type: "pass" });
    submitBid(game, "p4", { type: "pass" });
    return game;
}

// 1–2. Deck creation and uniqueness.
const deck = createDeck();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((card) => card.id)).size, 52);
assert.equal(shuffleDeck(deck).length, 52);

// 3–4. Four-player deal, 13 cards each.
const game = createBridgeGame(room());
assert.equal(game.players.length, 4);
assert.deepEqual(game.players.map((player) => player.hand.length), [13, 13, 13, 13]);
assert.equal(game.currentSeat, "N");

// 5–8. Auction turn order, bid ordering, pass handling, completion.
assert.throws(() => submitBid(game, "p2", { type: "pass" }), /not your turn/i);
submitBid(game, "p1", { type: "bid", level: 1, strain: "H" });
assert.throws(() => submitBid(game, "p2", { type: "bid", level: 1, strain: "C" }), /higher/i);
submitBid(game, "p2", { type: "pass" });
submitBid(game, "p3", { type: "pass" });
submitBid(game, "p4", { type: "pass" });
assert.equal(game.phase, "opening-lead");
assert.equal(game.contract.level, 1);
assert.equal(game.contract.strain, "H");

// 9–11. Contract, declarer and dummy.
assert.equal(game.contract.declarer, "N");
assert.equal(game.contract.dummy, "S");
assert.deepEqual(game.contract.defenders.sort(), ["E", "W"]);

// 12. Follow-suit validation and 18–20. Dummy reveal + dummy control + defender ownership.
const openingLeader = game.players.find((player) => player.seat === "E");
const lead = openingLeader.hand.find((card) => card.suit === "C") || openingLeader.hand[0];
playCard(game, "p2", lead.id, "E");
assert.equal(game.dummyRevealed, true);
assert.equal(game.currentSeat, "S");
assert.equal(game.turnActorId, "p1");

const dummy = game.players.find((player) => player.seat === "S");
const dummyFollow = dummy.hand.find((card) => card.suit === lead.suit);
const dummyOffSuit = dummy.hand.find((card) => card.suit !== lead.suit);
if (dummyFollow) {
    assert.throws(() => playCard(game, "p1", dummyOffSuit.id, "S"), /follow suit/i);
    playCard(game, "p1", dummyFollow.id, "S");
} else {
    playCard(game, "p1", dummyOffSuit.id, "S");
}
assert.throws(() => {
    const westCard = game.players.find((player) => player.seat === "W").hand[0];
    playCard(game, "p1", westCard.id, "W");
}, /only play from your own hand/i);

// 13–16. Full trick mechanics: trump wins, no-trump winner, leader progression, 13 tricks.
const trumpGame = startContractGame({ level: 1, strain: "S", suffix: "TR" });
const trumpLeader = trumpGame.players.find((player) => player.seat === "E");
trumpGame.players.forEach((player) => { player.hand = []; player.tricksWon = 0; });
trumpGame.players.find((p) => p.seat === "E").hand = [{ id: "2H", rank: "2", suit: "H" }];
trumpGame.players.find((p) => p.seat === "S").hand = [{ id: "3H", rank: "3", suit: "H" }];
trumpGame.players.find((p) => p.seat === "W").hand = [{ id: "4H", rank: "4", suit: "H" }];
trumpGame.players.find((p) => p.seat === "N").hand = [{ id: "2S", rank: "2", suit: "S" }];
playCard(trumpGame, "p2", "2H", "E");
playCard(trumpGame, "p1", "3H", "S");
playCard(trumpGame, "p4", "4H", "W");
playCard(trumpGame, "p1", "2S", "N");
assert.equal(trumpGame.lastTrickWinner, "N");
assert.equal(trumpGame.players.find((p) => p.seat === "N").tricksWon, 1);

const ntGame = createBridgeGame(room("BRNT1"));
ntGame.contract = {
    level: 1, strain: "NT", doubled: 0,
    declarer: "N", declarerId: "p1", dummy: "S", dummyId: "p3", defenders: ["E", "W"],
};
ntGame.phase = "trick-play";
ntGame.dummyRevealed = true;
ntGame.currentSeat = "E";
ntGame.turnActorId = "p2";
ntGame.players.forEach((player) => { player.hand = []; player.tricksWon = 0; });
ntGame.players.find((p) => p.seat === "E").hand = [{ id: "2C", rank: "2", suit: "C" }];
ntGame.players.find((p) => p.seat === "S").hand = [{ id: "3C", rank: "3", suit: "C" }];
ntGame.players.find((p) => p.seat === "W").hand = [{ id: "AC", rank: "A", suit: "C" }];
ntGame.players.find((p) => p.seat === "N").hand = [{ id: "KC", rank: "K", suit: "C" }];
playCard(ntGame, "p2", "2C", "E");
playCard(ntGame, "p1", "3C", "S");
playCard(ntGame, "p4", "AC", "W");
playCard(ntGame, "p1", "KC", "N");
assert.equal(ntGame.lastTrickWinner, "W");

// Full 13-trick simulation after a fresh 1NT contract.
const fullGame = startContractGame({ level: 1, strain: "NT", suffix: "13" });
let guard = 0;
while (fullGame.status === "playing") {
    guard += 1;
    if (guard > 60) throw new Error("Full 13-trick simulation exceeded expected actions.");
    const actor = fullGame.turnActorId;
    const sourceSeat = fullGame.currentSeat;
    const source = fullGame.players.find((player) => player.seat === sourceSeat);
    assert.ok(source, "Current source seat exists");
    const ledSuit = fullGame.trick[0]?.card.suit;
    const legal = ledSuit && source.hand.some((card) => card.suit === ledSuit)
        ? source.hand.find((card) => card.suit === ledSuit)
        : source.hand[0];
    assert.ok(legal, "A legal card exists");
    playCard(fullGame, actor, legal.id, sourceSeat);
}
assert.equal(fullGame.completedTricks.length, 13);
assert.equal(fullGame.status, "round-complete");
assert.ok(fullGame.result);

// 17. Next-deal-ready state is generated by the dealer-only socket path; engine starts a clean new deal via status reset.
assert.equal(fullGame.result.dealNumber, 1);

// 21–22. Invalid ownership/turn checks are enforced.
const invalidGame = startContractGame({ suffix: "INV" });
const eastCard = invalidGame.players.find((p) => p.seat === "E").hand[0];
assert.throws(() => playCard(invalidGame, "p1", eastCard.id, "E"), /opening leader/i);

// 23. Standard Contract Bridge scoring decisions.
assert.equal(calculateContractScore({ level: 1, strain: "NT", doubled: 0, madeTricks: 7, vulnerable: false }), 90);
assert.equal(calculateContractScore({ level: 3, strain: "NT", doubled: 0, madeTricks: 9, vulnerable: false }), 400);
assert.equal(calculateContractScore({ level: 4, strain: "S", doubled: 0, madeTricks: 9, vulnerable: false }), -50);
assert.equal(calculateContractScore({ level: 4, strain: "S", doubled: 0, madeTricks: 9, vulnerable: true }), -100);
assert.equal(calculateContractScore({ level: 6, strain: "NT", doubled: 0, madeTricks: 12, vulnerable: false }), 990);

// Doubles/redoubles and declarer derivation.
const doubled = createBridgeGame(room("BRDBL"));
submitBid(doubled, "p1", { type: "bid", level: 1, strain: "H" });
submitBid(doubled, "p2", { type: "pass" });
submitBid(doubled, "p3", { type: "pass" });
submitBid(doubled, "p4", { type: "double" });
submitBid(doubled, "p1", { type: "redouble" });
submitBid(doubled, "p2", { type: "pass" });
submitBid(doubled, "p3", { type: "pass" });
submitBid(doubled, "p4", { type: "pass" });
assert.equal(doubled.contract.doubled, 2);
assert.equal(doubled.contract.declarer, "N");

// 24. Reconnect state preserves the deal and private-card boundaries.
markPlayerConnection(doubled, "p2", false);
markPlayerConnection(doubled, "p2", true, "socket-new");
const northView = getPrivateState(doubled, "p1");
const eastView = getPrivateState(doubled, "p2");
assert.equal(northView.players.find((p) => p.id === "p2").hand.length, 0);
assert.equal(eastView.players.find((p) => p.id === "p2").hand.length, 13);

// 18–20. Dummy remains hidden before lead and exposed after lead.
const privacyGame = startContractGame({ suffix: "PRIV" });
const preLead = getPrivateState(privacyGame, "p1");
assert.equal(preLead.players.find((p) => p.seat === privacyGame.contract.dummy).hand.length, 0);
const privacyLead = privacyGame.players.find((p) => p.seat === privacyGame.openingLeader).hand[0];
playCard(privacyGame, privacyGame.players.find((p) => p.seat === privacyGame.openingLeader).id, privacyLead.id, privacyGame.openingLeader);
const postLead = getPrivateState(privacyGame, "p1");
assert.equal(postLead.players.find((p) => p.seat === privacyGame.contract.dummy).hand.length, 13);

console.log("✓ Bridge engine tests passed: deck, deal, auction, pass, bid ordering, contract, declarer/dummy, privacy, follow-suit, trump, no-trump, 13 tricks, scoring, doubles/redoubles, reconnect");
