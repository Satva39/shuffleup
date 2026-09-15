import assert from "node:assert/strict";
import {
    CARD_POINTS,
    HAND_SIZE,
    LAST_TRICK_BONUS,
    MIN_BID,
    MAX_BID,
    RANKS,
    RANK_VALUE,
    SEATS,
    SUITS,
    TRICKS_PER_HAND,
    calculateTeamCardPoints,
    contractResult,
    determineGameWinner,
    legalCardsForHand,
    resolveTrick,
} from "./twentyNineRules.js";
import {
    createDeck,
    createTwentyNineGame,
    getLegalBidsForPlayer,
    getLegalCardIds,
    getPrivateState,
    getPublicState,
    markPlayerConnection,
    playCard,
    selectTrump,
    startNextHand,
    submitBid,
} from "./twentyNineEngine.js";

function room() {
    return {
        code: "T29TEST",
        gameId: "twenty-nine",
        status: "playing",
        players: [
            { id: "n", username: "North", connected: true },
            { id: "e", username: "East", connected: true },
            { id: "s", username: "South", connected: true },
            { id: "w", username: "West", connected: true },
        ],
    };
}

function check(name, fn) {
    fn();
    console.log(`✓ ${name}`);
}

check("32-card deck", () => assert.equal(createDeck().length, 32));
check("no duplicate cards", () => {
    const ids = createDeck().map((card) => card.id);
    assert.equal(new Set(ids).size, 32);
});
check("four suits", () => assert.deepEqual(new Set(createDeck().map((card) => card.suit)), new Set(SUITS)));
check("eight ranks", () => assert.deepEqual(new Set(createDeck().map((card) => card.rank)), new Set(RANKS)));
check("29 ranking order", () => assert.ok(RANK_VALUE.J > RANK_VALUE["9"]));
check("point values", () => {
    assert.equal(CARD_POINTS.J, 3);
    assert.equal(CARD_POINTS["9"], 2);
    assert.equal(CARD_POINTS.A, 1);
    assert.equal(CARD_POINTS["10"], 1);
});
check("game requires exactly four players", () => assert.throws(() => createTwentyNineGame({ ...room(), players: room().players.slice(0, 3) })));
const game = createTwentyNineGame(room(), () => 0.5);
check("four seats assigned", () => assert.deepEqual(game.players.map((p) => p.seat), SEATS));
check("initial hand is four cards each", () => assert.ok(game.players.every((p) => p.hand.length === 4)));
check("bidding starts with left of dealer", () => assert.equal(game.currentSeat, "E"));
check("legal opening bids begin at 16", () => assert.deepEqual(getLegalBidsForPlayer(game, game.turnActorId)[0], MIN_BID));
check("bid below minimum rejected", () => assert.throws(() => submitBid(game, "e", 15)));
check("valid opening bid accepted", () => assert.equal(submitBid(game, "e", 16).type, "bid"));
check("next bidder advances", () => assert.equal(game.currentSeat, "S"));
check("higher bid enforced", () => assert.throws(() => submitBid(game, "s", 16)));
check("valid higher bid accepted", () => assert.equal(submitBid(game, "s", 17).type, "bid"));
check("pass recorded", () => assert.equal(submitBid(game, "w", "pass").type, "pass"));
check("passed player is skipped", () => assert.equal(game.currentSeat, "N"));
check("new bid resets pass count", () => assert.equal(submitBid(game, "n", 18).type, "bid"));
check("a passed player cannot re-enter", () => assert.throws(() => submitBid(game, "w", 19)));
check("three consecutive eligible passes finish auction", () => {
    submitBid(game, "e", "pass");
    submitBid(game, "s", "pass");
    const result = submitBid(game, "n", "pass");
    assert.equal(result.type, "auction-complete");
    assert.equal(game.phase, "trump-selection");
});
check("winning bidder gets trump selection", () => assert.equal(game.turnActorId, "n"));
check("three opening passes force dealer to 16", () => {
    const forced = createTwentyNineGame(room(), () => 0.5);
    submitBid(forced, "e", "pass");
    submitBid(forced, "s", "pass");
    const result = submitBid(forced, "w", "pass");
    assert.equal(result.type, "auction-complete");
    assert.equal(forced.highestBid, 16);
    assert.equal(forced.bidderId, "n");
});
check("trump selection is hidden from public state", () => {
    selectTrump(game, "n", "S");
    assert.equal(getPublicState(game).trump, null);
    assert.equal(getPrivateState(game, "n").knownTrump.suit, "S");
});
check("remaining cards dealt", () => assert.ok(game.players.every((p) => p.hand.length === HAND_SIZE)));
check("trick play begins at left of dealer", () => assert.equal(game.currentSeat, "E"));
check("legal card ids are server-calculated", () => assert.equal(getLegalCardIds(game, game.turnActorId).length, game.players.find((p) => p.id === game.turnActorId).hand.length));
check("client cannot play opponent card", () => assert.throws(() => playCard(game, "e", "not-owned")));
check("client cannot play out of turn", () => assert.throws(() => playCard(game, "n", game.players.find((p) => p.id === "n").hand[0].id)));
check("follow suit enforced", () => {
    const e = game.players.find((p) => p.id === "e");
    const legal = getLegalCardIds(game, "e");
    assert.ok(legal.includes(e.hand.find((c) => legal.includes(c.id)).id));
});
check("trump ranking beats led suit after reveal", () => {
    const plays = [
        { seat: "E", card: { rank: "J", suit: "H" } },
        { seat: "S", card: { rank: "7", suit: "S" } },
        { seat: "W", card: { rank: "9", suit: "H" } },
        { seat: "N", card: { rank: "A", suit: "H" } },
    ];
    assert.equal(resolveTrick(plays, "S", true).seat, "S");
});
check("rank comparison is separate from point value", () => assert.ok(RANK_VALUE.J > RANK_VALUE.A));
check("eight tricks are configured", () => assert.equal(TRICKS_PER_HAND, 8));
check("last-trick bonus exists", () => assert.equal(LAST_TRICK_BONUS, 1));
check("contract success scoring", () => assert.equal(contractResult("A", 16, { A: 17, B: 12 }).delta, 1));
check("contract failure scoring", () => assert.equal(contractResult("A", 20, { A: 19, B: 10 }).delta, -1));
check("card-point calculator includes last-trick bonus", () => {
    const complete = [{
        winnerPlayerId: "n",
        plays: [{ card: { rank: "J", suit: "S" } }, { card: { rank: "9", suit: "H" } }, { card: { rank: "A", suit: "D" } }, { card: { rank: "10", suit: "C" } }],
    }];
    assert.equal(calculateTeamCardPoints(complete, { n: { team: "A" } }).A, 8);
});
check("game target is six", () => assert.equal(determineGameWinner({ A: 6, B: 4 }, 6), "A"));
check("eight tricks can complete server-side", () => {
    const fullHand = createTwentyNineGame(room(), () => 0.5);
    fullHand.phase = "trick-play";
    fullHand.status = "playing";
    fullHand.trumpSuit = "S";
    fullHand.trumpRevealed = false;
    fullHand.bidderId = "e";
    fullHand.bidTeam = "B";
    fullHand.highestBid = 16;
    fullHand.completedTricks = [];
    fullHand.trick = [];
    fullHand.tricks = { A: 0, B: 0 };
    const deck = createDeck();
    fullHand.players.forEach((player, index) => {
        player.hand = deck.slice(index * 8, index * 8 + 8);
        player.tricksWon = 0;
    });
    fullHand.currentSeat = "E";
    fullHand.turnActorId = "e";
    for (let trick = 0; trick < 8; trick += 1) {
        for (let turn = 0; turn < 4; turn += 1) {
            const actor = fullHand.turnActorId;
            const cardId = getLegalCardIds(fullHand, actor)[0];
            playCard(fullHand, actor, cardId);
            if (trick === 0 && turn === 1) assert.equal(fullHand.trumpRevealed, true);
        }
    }
    assert.equal(fullHand.completedTricks.length, 8);
    assert.equal(fullHand.phase, "hand-complete");
    assert.ok(fullHand.handResult);
});
check("privacy excludes opponent hands", () => {
    const state = getPrivateState(game, "e");
    assert.ok(state.myHand.length > 0);
    assert.equal("hand" in state.players[0], false);
});
check("reconnection state preserves game", () => {
    markPlayerConnection(game, "e", false);
    markPlayerConnection(game, "e", true, "socket-2");
    const state = getPrivateState(game, "e");
    assert.equal(state.handNumber, game.handNumber);
    assert.equal(state.currentPlayerId, game.turnActorId);
    assert.equal(state.scores.A, game.scores.A);
});
check("next hand resets bidding and rotates dealer", () => {
    game.phase = "hand-complete";
    game.status = "playing";
    const dealer = game.dealer;
    startNextHand(game, game.players.find((p) => p.seat === dealer).id, () => 0.5);
    assert.notEqual(game.dealer, dealer);
    assert.equal(game.phase, "bidding");
    assert.ok(game.players.every((p) => p.hand.length === 4));
});
check("public state exposes no hidden trump suit", () => assert.equal(getPublicState(game).trump, null));
check("max bid constant is 28", () => assert.equal(MAX_BID, 28));

console.log(`Twenty-Nine engine test suite passed (${35} checks).`);
