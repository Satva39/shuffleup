let ioServer = null;

export function setActiveSocketServer(io) {
  ioServer = io;
}

export function disconnectUserSockets(userId) {
  if (!ioServer || userId === undefined || userId === null) return;
  ioServer.in(`auth-user:${String(userId)}`).disconnectSockets(true);
}
