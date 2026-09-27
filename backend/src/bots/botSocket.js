import { randomUUID } from "node:crypto";

/**
 * A lightweight in-process Socket.IO-compatible player connection.
 * Game socket modules see the same `on`, `emit`, `join`, and `data`
 * surface as a normal socket, but no network connection is involved.
 */
export class BotSocket {
  constructor({ id, userId, username, roomCode }) {
    this.id = id;
    this.handshake = { auth: {} };
    this.data = {
      authUserId: userId,
      authUsername: username,
      userId,
      roomCode,
      isBot: true,
    };
    this.rooms = new Set();
    this.clientHandlers = new Map();
    this.serverHandlers = new Map();
    this.serverEventLog = [];
  }

  on(event, handler) {
    if (!this.clientHandlers.has(event)) this.clientHandlers.set(event, []);
    this.clientHandlers.get(event).push(handler);
    return this;
  }

  once(event, handler) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      return handler(...args);
    };
    return this.on(event, wrapped);
  }

  off(event, handler) {
    const handlers = this.clientHandlers.get(event) || [];
    this.clientHandlers.set(
      event,
      handlers.filter((candidate) => candidate !== handler),
    );
    return this;
  }

  join(roomCode) {
    this.rooms.add(String(roomCode).toUpperCase());
    return Promise.resolve();
  }

  leave(roomCode) {
    this.rooms.delete(String(roomCode).toUpperCase());
    return Promise.resolve();
  }

  /** Server -> bot. Game state events land here. */
  emit(event, payload) {
    this.receiveServerEvent(event, payload);
    return true;
  }

  receiveServerEvent(event, payload) {
    this.serverEventLog.push({ event, payload, at: Date.now() });
    const handlers = this.serverHandlers.get(event) || [];
    for (const handler of handlers) handler(payload);
  }

  onServer(event, handler) {
    if (!this.serverHandlers.has(event)) this.serverHandlers.set(event, []);
    this.serverHandlers.get(event).push(handler);
    return this;
  }

  /** Client -> server through the exact event handler registered by the game module. */
  clientEmit(event, payload = {}, timeoutMs = 5000) {
    const handlers = this.clientHandlers.get(event) || [];
    if (!handlers.length) {
      return Promise.resolve({
        success: false,
        message: `No handler registered for ${event}.`,
      });
    }

    return new Promise((resolve) => {
      let settled = false;
      const settle = (result) => {
        if (settled) return;
        settled = true;
        resolve(result || { success: true });
      };

      const timer = setTimeout(() => {
        settle({ success: false, message: `Bot action timed out: ${event}.` });
      }, timeoutMs);

      const callback = (result) => {
        clearTimeout(timer);
        settle(result);
      };

      try {
        for (const handler of handlers) {
          handler(payload, callback);
          if (settled) break;
        }
      } catch (error) {
        clearTimeout(timer);
        settle({
          success: false,
          message: error.message || "Bot action failed.",
        });
      }
    });
  }

  disconnect() {
    const handlers = this.clientHandlers.get("disconnect") || [];
    for (const handler of handlers) handler("bot-disconnect");
  }
}

export function createBotIdentity(username) {
  const id = `bot:${randomUUID()}`;
  return { id, username };
}
