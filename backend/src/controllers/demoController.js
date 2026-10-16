import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const DEMO_DURATION_MS = 2 * 60 * 1000;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SESSIONS_PER_WINDOW = 5;
const ipStarts = new Map();

function consumeRateLimit(ip, now = Date.now()) {
  const key = String(ip || "unknown").slice(0, 100);
  const recent = (ipStarts.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_SESSIONS_PER_WINDOW) {
    ipStarts.set(key, recent);
    return false;
  }
  recent.push(now);
  ipStarts.set(key, recent);
  if (ipStarts.size > 5000) {
    for (const [candidate, times] of ipStarts) {
      if (!times.some((timestamp) => now - timestamp < WINDOW_MS)) ipStarts.delete(candidate);
    }
  }
  return true;
}

export function createDemoSession(req, res) {
  if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 32) {
    return res.status(503).json({ message: "Demo sessions are not configured on this server." });
  }
  if (!consumeRateLimit(req.ip || req.socket?.remoteAddress)) {
    return res.status(429).json({ message: "Too many demo sessions. Please try again later." });
  }
  const now = Date.now();
  const expiresAt = now + DEMO_DURATION_MS;
  const id = `guest:${randomUUID()}`;
  const username = `Guest ${id.slice(-5).toUpperCase()}`;
  const token = jwt.sign(
    { id, username, type: "demo", demoExpiresAt: expiresAt },
    process.env.JWT_SECRET,
    { expiresIn: "120s", subject: id },
  );
  res.set("Cache-Control", "no-store");
  return res.status(201).json({
    token,
    user: { id, username, isGuest: true },
    expiresAt,
    durationSeconds: 120,
    allowedModes: ["bots"],
    message: "Your two-minute demo has started. Demo sessions can only create bot games.",
  });
}

export { DEMO_DURATION_MS };
