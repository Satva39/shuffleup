import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createDemoSession, DEMO_DURATION_MS } from "../controllers/demoController.js";

const priorSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "unit-test-demo-secret-that-is-long-enough-123456";
const res = {
  statusCode: 200,
  headers: {},
  body: null,
  status(code) { this.statusCode = code; return this; },
  set(key, value) { this.headers[key] = value; return this; },
  json(body) { this.body = body; return this; },
};
try {
  createDemoSession({ ip: `demo-test-${Date.now()}` }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.body.durationSeconds, 120);
  assert.equal(res.body.allowedModes.includes("bots"), true);
  const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.type, "demo");
  assert.match(decoded.id, /^guest:/);
  assert.ok(decoded.demoExpiresAt - Date.now() <= DEMO_DURATION_MS);
  assert.ok(decoded.demoExpiresAt - Date.now() > 0);
  console.log("✓ Demo session JWT duration, guest identity and no-store response tests passed");
} finally {
  if (priorSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = priorSecret;
}
