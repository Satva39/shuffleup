import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import setupSocket from "./sockets/socketServer.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
    },
});

setupSocket(io);

httpServer.listen(PORT, () => {
    console.log(
        `ShuffleUp backend running on port ${PORT}`
    );
});