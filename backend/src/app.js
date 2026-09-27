import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import { GAME_IDS, GAME_LIMITS } from "../../shared/constants/platform.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json());

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

export default app;
