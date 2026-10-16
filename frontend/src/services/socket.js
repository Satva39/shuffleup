import { io } from "socket.io-client";
import { API_BASE_URL } from "./apiBase";

const SOCKET_URL = API_BASE_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (callback) => {
        callback({
            token: localStorage.getItem("shuffleup_token") || localStorage.getItem("shuffleup_demo_token"),
        });
    },
});