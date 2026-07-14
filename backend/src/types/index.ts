export type CardStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Card {
  id: string;
  title: string;
  status: CardStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardInput {
  title: string;
  status?: CardStatus;
}

export interface UpdateCardTitleInput {
  title: string;
}

export interface UpdateCardStatusInput {
  status: CardStatus;
  position?: number;
}

export interface ReorderItem {
  id: string;
  status: CardStatus;
  position: number;
}

export interface ReorderInput {
  cards: ReorderItem[];
}

// Socket.IO event payloads
export interface SocketMeta {
  /** id of the socket that originated the change, so it can skip re-applying it */
  originSocketId: string;
}

export type CardCreatedEvent = { card: Card } & SocketMeta;
export type CardUpdatedEvent = { card: Card } & SocketMeta;
export type CardDeletedEvent = { id: string } & SocketMeta;
export type CardMovedEvent = { card: Card } & SocketMeta;
export type CardsReorderedEvent = { cards: Card[] } & SocketMeta;
