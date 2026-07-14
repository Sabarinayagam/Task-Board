export type CardStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Card {
  id: string;
  title: string;
  status: CardStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderItem {
  id: string;
  status: CardStatus;
  position: number;
}

export interface SocketMeta {
  originSocketId: string;
}

export type CardCreatedEvent = { card: Card } & SocketMeta;
export type CardUpdatedEvent = { card: Card } & SocketMeta;
export type CardDeletedEvent = { id: string } & SocketMeta;
export type CardMovedEvent = { card: Card } & SocketMeta;
export type CardsReorderedEvent = { cards: Card[] } & SocketMeta;

export interface PresenceUpdateEvent {
  count: number;
}

export const COLUMN_ORDER: CardStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const COLUMN_LABELS: Record<CardStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};
