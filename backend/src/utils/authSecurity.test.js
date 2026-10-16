import assert from "node:assert/strict";
import {
  createAuthToken,
  hashAuthToken,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from "./authSecurity.js";

assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
assert.equal(isValidEmail("user@example.com"), true);
assert.equal(isValidEmail("not-an-email"), false);
assert.equal(validatePassword("short"), "Password must be at least 8 characters.");
assert.equal(validatePassword("password123"), "Choose a less common password.");
assert.equal(validatePassword("aaaaaaaa"), "Password cannot use the same character repeatedly.");
assert.equal(validatePassword("h0rse-Battery-2026"), null);
assert.equal(validatePassword("x".repeat(129)), "Password must be 128 characters or fewer.");

const token = createAuthToken();
assert.ok(token.length >= 40);
assert.notEqual(token, createAuthToken());
assert.equal(hashAuthToken(token).length, 64);
assert.equal(hashAuthToken(token), hashAuthToken(token));
assert.notEqual(hashAuthToken(token), token);

console.log("✓ Auth security helper tests passed");
