import { Server, Socket } from 'socket.io';

// Tracks currently connected sockets in memory. Since every visitor shares
// the same single board and there is no auth, "online users" is simply the
// number of live socket connections. For a multi-instance deployment this
// would move to a shared store (e.g. Redis) keyed by socket id.
const connectedSockets = new Set<string>();

export function getOnlineCount(): number {
  return connectedSockets.size;
}

export function registerPresenceHandlers(io: Server, socket: Socket) {
  connectedSockets.add(socket.id);
  broadcastPresence(io);

  socket.on('disconnect', () => {
    connectedSockets.delete(socket.id);
    broadcastPresence(io);
  });
}

function broadcastPresence(io: Server) {
  io.emit('presence_update', { count: getOnlineCount() });
}
