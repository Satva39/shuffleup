import { io } from "socket.io-client";
import { SOCKET_URL } from "../constants/config";

class ShuffleSocket {
  socket = null;
  token = null;
  listeners = new Map();

  connect(token) {
    if (!token) throw new Error("Authentication token is required.");

    if (this.socket && this.token === token) {
      if (!this.socket.connected) this.socket.connect();
      return this.socket;
    }

    this.disconnect();
    this.token = token;

    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 750,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    for (const [event, handlers] of this.listeners.entries()) {
      for (const handler of handlers) this.socket.on(event, handler);
    }

    this.socket.connect();
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    this.socket?.on(event, handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    this.socket = null;
    this.token = null;
  }

  emit(event, payload, callback) {
    if (!this.socket?.connected) throw new Error("Not connected to ShuffleUp.");
    this.socket.emit(event, payload, callback);
  }

  emitSafe(event, payload, callback) {
    if (!this.socket) {
      callback?.({ success: false, message: "Socket is unavailable." });
      return false;
    }

    if (!this.socket.connected) {
      callback?.({
        success: false,
        message: "Waiting for the multiplayer connection…",
      });
      return false;
    }

    this.socket.emit(event, payload, callback);
    return true;
  }
}

export const shuffleSocket = new ShuffleSocket();
