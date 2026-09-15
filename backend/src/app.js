import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
    })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "ShuffleUp backend is running.",
    });
});

app.use("/api/auth", authRoutes);

export default app;