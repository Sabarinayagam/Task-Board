import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { registerPresenceHandlers, getOnlineCount } from './presence';
import {
  Card,
  CardCreatedEvent,
  CardDeletedEvent,
  CardMovedEvent,
  CardUpdatedEvent,
  CardsReorderedEvent,
} from '../types';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
    },
    // Allows clients behind flaky networks / proxies to fall back to
    // long-polling if a WebSocket upgrade fails.
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    registerPresenceHandlers(io as Server, socket);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return io;
}

// Helper broadcasters used by controllers after a mutation succeeds.
// `originSocketId` lets the client that made the change ignore its own
// broadcast (it already applied the change optimistically).

export function emitCardCreated(card: Card, originSocketId: string) {
  const payload: CardCreatedEvent = { card, originSocketId };
  getIO().emit('card_created', payload);
}

export function emitCardUpdated(card: Card, originSocketId: string) {
  const payload: CardUpdatedEvent = { card, originSocketId };
  getIO().emit('card_updated', payload);
}

export function emitCardDeleted(id: string, originSocketId: string) {
  const payload: CardDeletedEvent = { id, originSocketId };
  getIO().emit('card_deleted', payload);
}

export function emitCardMoved(card: Card, originSocketId: string) {
  const payload: CardMovedEvent = { card, originSocketId };
  getIO().emit('card_moved', payload);
}

export function emitCardsReordered(cards: Card[], originSocketId: string) {
  const payload: CardsReorderedEvent = { cards, originSocketId };
  getIO().emit('cards_reordered', payload);
}

export { getOnlineCount };
