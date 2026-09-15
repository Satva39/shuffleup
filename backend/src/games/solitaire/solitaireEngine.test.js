import assert from "node:assert/strict";
import test from "node:test";
import {
    applyPlayerMove,
    createPlayerStateForTests,
    createSolitaireGame,
    drawStock,
    getDeckForTests,
    getPrivateState,
    getPublicState,
    validateStateForTests,
} from "./solitaireEngine.js";

const room = {
    code: "TEST01",
    gameId: "solitaire",
    players: [
        { id: "p1", username: "One", socketId: "s1", connected: true },
        { id: "p2", username: "Two", socketId: "s2", connected: true },
    ],
};

const symbols = { S: "♠", H: "♥", D: "♦", C: "♣" };
const reds = new Set(["H", "D"]);
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["S", "H", "D", "C"];

function card(rank, suit, faceUp = true) {
    return {
        id: `${rank}${suit}`,
        rank,
        suit,
        symbol: symbols[suit],
        color: reds.has(suit) ? "red" : "black",
        faceUp,
    };
}

function freshDeckMap() {
    return new Map(
        getDeckForTests(() => 0.91).map((item) => [
            item.id,
            card(item.rank, item.suit, false),
        ])
    );
}

function controlledPlayer({
    tableau,
    waste = [],
    foundations = { S: [], H: [], D: [], C: [] },
}) {
    const player = createPlayerStateForTests(
        room.players[0],
        0,
        getDeckForTests(() => 0.13)
    );

    const map = freshDeckMap();
    const used = new Set();

    function take(id, faceUp = true) {
        const item = map.get(id);
        if (!item) throw new Error(`Missing test card ${id}`);
        used.add(id);
        return { ...item, faceUp };
    }

    player.tableau = Array.from({ length: 7 }, (_, columnIndex) =>
        (tableau[columnIndex] || []).map((idOrCard) =>
            typeof idOrCard === "string"
                ? take(idOrCard, true)
                : take(idOrCard.id, idOrCard.faceUp)
        )
    );

    player.waste = waste.map((id) => take(id, true));

    player.foundations = {
        S: foundations.S.map((id) => take(id, true)),
        H: foundations.H.map((id) => take(id, true)),
        D: foundations.D.map((id) => take(id, true)),
        C: foundations.C.map((id) => take(id, true)),
    };

    player.stock = [...map.values()]
        .filter((item) => !used.has(item.id))
        .map((item) => ({ ...item, faceUp: false }));

    validateStateForTests(player);
    return player;
}

test("creates a 52-card deck with unique cards", () => {
    const deck = getDeckForTests(() => 0.5);
    assert.equal(deck.length, 52);
    assert.equal(new Set(deck.map((item) => item.id)).size, 52);
});

test("creates an independent deck state for every player", () => {
    const game = createSolitaireGame(room, () => 0.5);
    const one = game.players[0];
    const two = game.players[1];

    assert.equal(
        one.tableau.reduce((sum, column) => sum + column.length, 0),
        28
    );
    assert.equal(
        two.tableau.reduce((sum, column) => sum + column.length, 0),
        28
    );

    one.tableau[0][0].faceUp = false;
    assert.equal(two.tableau[0][0].faceUp, true);
});

test("deals 1..7 tableau cards with only top cards face up", () => {
    const game = createSolitaireGame(room, () => 0.37);
    const player = game.players[0];

    assert.deepEqual(
        player.tableau.map((column) => column.length),
        [1, 2, 3, 4, 5, 6, 7]
    );

    player.tableau.forEach((column) => {
        column.forEach((item, index) => {
            assert.equal(item.faceUp, index === column.length - 1);
        });
    });

    assert.equal(player.stock.length, 24);
    assert.equal(player.waste.length, 0);
});

test("reveals the next face-down tableau card after a sequence moves away", () => {
    const player = controlledPlayer({
        tableau: [
            [{ id: "7S", faceUp: false }, "8C"],
            ["9H"],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "tableau", columnIndex: 0, cardIndex: 1 },
        to: { type: "tableau", columnIndex: 1 },
    });

    assert.equal(player.tableau[0][0].faceUp, true);
    assert.equal(player.tableau[0][0].rank, "7");
});

test("allows legal alternating-color descending tableau moves", () => {
    const player = controlledPlayer({
        tableau: [
            ["8C"],
            ["9H"],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "tableau", columnIndex: 0, cardIndex: 0 },
        to: { type: "tableau", columnIndex: 1 },
    });

    assert.deepEqual(
        player.tableau[1].map((item) => item.id),
        ["9H", "8C"]
    );
});

test("rejects same-color or wrong-rank tableau moves", () => {
    const player = controlledPlayer({
        tableau: [
            ["8H"],
            ["9D"],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    assert.throws(
        () =>
            applyPlayerMove(game, "p1", {
                from: { type: "tableau", columnIndex: 0, cardIndex: 0 },
                to: { type: "tableau", columnIndex: 1 },
            }),
        /Illegal tableau move/
    );
});

test("allows a King into an empty tableau column", () => {
    const player = controlledPlayer({
        tableau: [
            ["KS"],
            [],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "tableau", columnIndex: 0, cardIndex: 0 },
        to: { type: "tableau", columnIndex: 1 },
    });

    assert.equal(player.tableau[1][0].id, "KS");
});

test("allows Ace to start a foundation and builds upward by suit", () => {
    const player = controlledPlayer({
        tableau: [
            ["2S"],
            ["AS"],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "tableau", columnIndex: 1, cardIndex: 0 },
        to: { type: "foundation" },
    });

    applyPlayerMove(game, "p1", {
        from: { type: "tableau", columnIndex: 0, cardIndex: 0 },
        to: { type: "foundation" },
    });

    assert.deepEqual(
        player.foundations.S.map((item) => item.rank),
        ["A", "2"]
    );
});

test("rejects foundation cards of the wrong suit or rank", () => {
    const player = controlledPlayer({
        tableau: [
            ["2H"],
            ["AS"],
            [],
            [],
            [],
            [],
            [],
        ],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    assert.throws(
        () =>
            applyPlayerMove(game, "p1", {
                from: { type: "tableau", columnIndex: 0, cardIndex: 0 },
                to: { type: "foundation" },
            }),
        /Illegal foundation move/
    );
});

test("supports waste-to-tableau and waste-to-foundation moves", () => {
    const player = controlledPlayer({
        tableau: [
            ["9H"],
            [],
            [],
            [],
            [],
            [],
            [],
        ],
        waste: ["8C"],
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "waste" },
        to: { type: "tableau", columnIndex: 0 },
    });

    assert.deepEqual(player.tableau[0].map((item) => item.id), ["9H", "8C"]);
    assert.equal(player.waste.length, 0);

    const acePlayer = controlledPlayer({
        tableau: [[], [], [], [], [], [], []],
        waste: ["AS"],
    });
    const aceGame = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [acePlayer],
    };

    applyPlayerMove(aceGame, "p1", {
        from: { type: "waste" },
        to: { type: "foundation" },
    });

    assert.equal(acePlayer.foundations.S[0].id, "AS");
});

test("stock draw moves the next stock card to waste", () => {
    const game = createSolitaireGame(room, () => 0.12);
    const player = game.players[0];

    const before = player.stock.length;
    const result = drawStock(game, player.id);

    assert.equal(player.stock.length, before - 1);
    assert.equal(player.waste.length, 1);
    assert.equal(result.drawResult.type, "draw");
    assert.equal(player.waste[0].faceUp, true);
});

test("empty stock redeals the complete waste and clears waste", () => {
    const player = controlledPlayer({
        tableau: [[], [], [], [], [], [], []],
        waste: ["AS", "2S", "3S"],
    });

    player.stock = [
        ...player.stock,
        ...player.waste,
    ].map((item) => ({ ...item, faceUp: true }));
    player.waste = [];

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    const result = drawStock(game, player.id);

    assert.equal(result.drawResult.type, "draw");

    while (player.stock.length) {
        drawStock(game, player.id);
    }

    const redeal = drawStock(game, player.id);

    assert.equal(redeal.drawResult.type, "redeal");
    assert.equal(player.waste.length, 0);
    assert.equal(player.stock.length, 52);
    assert.ok(player.stock.every((item) => item.faceUp === false));
});

test("client-private state contains the full own board but public state does not", () => {
    const game = createSolitaireGame(room, () => 0.27);
    const privateState = getPrivateState(game, "p1");
    const publicState = getPublicState(game);

    assert.equal(privateState.player.tableau.length, 7);
    assert.equal(privateState.player.stockCount, 24);
    assert.equal(publicState.players[0].tableau, undefined);
    assert.equal(publicState.players[0].stock, undefined);
    assert.equal(publicState.players[0].progress, 0);
});

test("card conservation stays at 52 after repeated stock draws", () => {
    const game = createSolitaireGame(room, () => 0.39);
    const player = game.players[0];

    for (let index = 0; index < 8; index += 1) {
        drawStock(game, player.id);
    }

    validateStateForTests(player);
    assert.equal(
        player.tableau.flat().length +
        player.stock.length +
        player.waste.length +
        Object.values(player.foundations).flat().length,
        52
    );
});

test("marks a player complete only after all 52 cards reach foundations", () => {
    const foundationCards = {
        S: ranks.slice(0, 13).map((rank) => `${rank}S`),
        H: ranks.slice(0, 13).map((rank) => `${rank}H`),
        D: ranks.slice(0, 13).map((rank) => `${rank}D`),
        C: ranks.slice(0, 12).map((rank) => `${rank}C`),
    };

    const player = controlledPlayer({
        tableau: [[], [], [], [], [], [], []],
        waste: ["KC"],
        foundations: foundationCards,
    });

    const game = {
        status: "playing",
        roomCode: "TEST01",
        gameId: "solitaire",
        players: [player],
    };

    applyPlayerMove(game, "p1", {
        from: { type: "waste" },
        to: { type: "foundation" },
    });

    assert.equal(player.completed, true);
    assert.equal(player.completionSeconds >= 0, true);
    assert.equal(player.score > 0, true);
    assert.equal(game.status, "complete");
});

test("invalid player actions cannot move another player's board", () => {
    const game = createSolitaireGame(room, () => 0.53);

    assert.throws(
        () =>
            applyPlayerMove(game, "not-a-player", {
                from: { type: "waste" },
                to: { type: "foundation" },
            }),
        /not part of this Solitaire game/
    );
});

test("disconnected player cannot move until reconnects", () => {
    const game = createSolitaireGame(room, () => 0.61);
    const player = game.players[0];
    player.connected = false;

    assert.throws(
        () =>
            applyPlayerMove(game, player.id, {
                from: { type: "waste" },
                to: { type: "foundation" },
            }),
        /Reconnect before making moves/
    );
});
