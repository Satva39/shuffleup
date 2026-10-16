import assert from "node:assert/strict";
import { getPerformanceSnapshot, resetPerformanceSamplesForTest, requestMetricsMiddleware } from "./requestMetrics.js";

resetPerformanceSamplesForTest();
let finishHandler;
const res = {
  statusCode: 200,
  once(event, handler) { assert.equal(event, "finish"); finishHandler = handler; },
};
let nextCalled = false;
requestMetricsMiddleware({ method: "GET", path: "/api/room/ABC123", route: { path: "/api/room/:code" } }, res, () => { nextCalled = true; });
assert.equal(nextCalled, true);
res.statusCode = 200;
finishHandler();
const snapshot = getPerformanceSnapshot();
assert.equal(snapshot.sampleWindow, 1);
assert.equal(snapshot.routes[0].route, "GET /api/room/:code");
assert.equal(snapshot.serverErrorRate, 0);
assert.ok(snapshot.p50Ms >= 0);
console.log("Request metrics test passed.");
