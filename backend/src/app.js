import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import { GAME_IDS, GAME_LIMITS } from "../../shared/constants/platform.js";
import { getLiveCounts } from "./sockets/roomManager.js";
import {
  getPerformanceSnapshot,
  requestMetricsMiddleware,
} from "./utils/requestMetrics.js";
import { timingSafeEqual } from "node:crypto";

dotenv.config();

const app = express();

// Configure only when the backend is behind a known reverse proxy (for example,
// the single proxy layer used by the hosting platform). Leaving it unset avoids
// trusting arbitrary client-supplied forwarded headers.
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
  app.set("trust proxy", trustProxyHops);
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json());
app.use(requestMetricsMiddleware);

app.get("/api/live-counts", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getLiveCounts());
});

// Operational performance data is disabled unless an owner-configured key is
// present. Do not expose internal request telemetry on production by default.
app.get("/api/performance-metrics", (req, res) => {
  const expected = process.env.METRICS_API_KEY;
  const supplied = String(req.get("x-metrics-key") || "");
  if (!expected || !supplied) return res.sendStatus(404);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return res.sendStatus(404);
  }
  return res.json(getPerformanceSnapshot());
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ShuffleUp backend is running.",
  });
});

app.get("/api/game-config", (req, res) => {
  const botGames = Object.entries(GAME_LIMITS)
    .filter(([gameId]) => gameId !== GAME_IDS.SOLITAIRE)
    .map(([gameId, limits]) => ({
      gameId,
      minPlayers: limits.min,
      maxPlayers: limits.max,
      minBots: Math.max(1, limits.min - 1),
      maxBots: limits.max - 1,
    }));

  res.json({ botGames });
});

app.use("/api/auth", authRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/demo", demoRoutes);

export default app;
