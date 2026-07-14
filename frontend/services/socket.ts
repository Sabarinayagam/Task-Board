import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

// Lazily creates a single shared Socket.IO client instance for the whole
// app (singleton pattern), so every hook/component talks to the same
// connection instead of opening one socket per component.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function getSocketId(): string | undefined {
  return socket?.id;
}
