import { createHash, randomBytes } from "node:crypto";

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "password",
  "password123",
  "qwerty123",
  "letmein123",
  "iloveyou",
  "admin123",
  "welcome123",
  "abc12345",
]);

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(value) {
  if (typeof value !== "string") return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 128) return "Password must be 128 characters or fewer.";
  const normalized = value.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    return "Choose a less common password.";
  }
  if (/^(.)\1{7,}$/u.test(value)) {
    return "Password cannot use the same character repeatedly.";
  }
  return null;
}

export function createAuthToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAuthToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
