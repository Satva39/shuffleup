import assert from "node:assert/strict";
import { extractWinnerIds } from "./gameStats.js";

const seats = [
  { id: "human-1", username: "Alice" },
  { id: "human-2", username: "Bob" },
  { id: "bot:123", username: "Bot" },
];
assert.deepEqual(extractWinnerIds({ winnerId: "human-1" }, seats), ["human-1"]);
assert.deepEqual(extractWinnerIds({ winnerIds: ["human-2", "bot:123", "stranger"] }, seats), ["human-2", "bot:123"]);
assert.deepEqual(extractWinnerIds({ result: { winnerId: "human-2" } }, seats), ["human-2"]);
assert.deepEqual(extractWinnerIds({ winner: { id: "human-2", username: "Bob" } }, seats), ["human-2"]);
assert.deepEqual(extractWinnerIds({ status: "complete", rankings: [{ rank: 1, id: "human-2" }, { rank: 2, id: "human-1" }] }, seats), ["human-2"]);
assert.deepEqual(extractWinnerIds({ loserId: "human-2" }, seats), ["human-1", "bot:123"]);
assert.deepEqual(extractWinnerIds({ winnerTeam: "A", players: [
  { id: "human-1", username: "Alice", team: "A" },
  { id: "human-2", username: "Bob", team: "B" },
  { id: "bot:123", username: "Bot", team: "A" },
] }, seats), ["human-1", "bot:123"]);
assert.deepEqual(extractWinnerIds({ score: 99 }, seats), [], "unknown outcomes must not be inferred from scores alone");
console.log("✓ Persistent game-stat winner extraction tests passed");
