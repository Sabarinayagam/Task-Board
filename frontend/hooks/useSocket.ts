'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socket';
import { CARDS_QUERY_KEY } from '@/lib/queryClient';
import {
  Card,
  CardCreatedEvent,
  CardDeletedEvent,
  CardMovedEvent,
  CardUpdatedEvent,
  CardsReorderedEvent,
  PresenceUpdateEvent,
} from '@/types';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseSocketResult {
  status: ConnectionStatus;
  onlineCount: number;
}

// Central place where the app wires Socket.IO events into the React Query
// cache. Whenever another client mutates a card, the corresponding event
// updates our local cache directly (no refetch needed) unless the change
// originated from this exact socket, in which case it's skipped because
// the mutation's optimistic update already applied it.
export function useSocket(): UseSocketResult {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    const socket = getSocket();

    const isOwnUpdate = (originSocketId: string) => originSocketId && originSocketId === socket.id;

    function handleConnect() {
      setStatus('connected');
      // On (re)connect, refetch the full board so any changes missed while
      // disconnected are synchronized.
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY });
    }

    function handleDisconnect() {
      setStatus('reconnecting');
    }

    function handleReconnectAttempt() {
      setStatus('reconnecting');
    }

    function handleCardCreated({ card, originSocketId }: CardCreatedEvent) {
      if (isOwnUpdate(originSocketId)) return;
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) => [...old, card]);
    }

    function handleCardUpdated({ card, originSocketId }: CardUpdatedEvent) {
      if (isOwnUpdate(originSocketId)) return;
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === card.id ? card : c))
      );
    }

    function handleCardMoved({ card, originSocketId }: CardMovedEvent) {
      if (isOwnUpdate(originSocketId)) return;
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === card.id ? card : c))
      );
    }

    function handleCardDeleted({ id, originSocketId }: CardDeletedEvent) {
      if (isOwnUpdate(originSocketId)) return;
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) => old.filter((c) => c.id !== id));
    }

    function handleCardsReordered({ cards, originSocketId }: CardsReorderedEvent) {
      if (isOwnUpdate(originSocketId)) return;
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) => {
        const byId = new Map(cards.map((c) => [c.id, c]));
        return old.map((c) => byId.get(c.id) ?? c);
      });
    }

    function handlePresenceUpdate({ count }: PresenceUpdateEvent) {
      setOnlineCount(count);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('card_created', handleCardCreated);
    socket.on('card_updated', handleCardUpdated);
    socket.on('card_moved', handleCardMoved);
    socket.on('card_deleted', handleCardDeleted);
    socket.on('cards_reordered', handleCardsReordered);
    socket.on('presence_update', handlePresenceUpdate);

    if (socket.connected) {
      setStatus('connected');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('card_created', handleCardCreated);
      socket.off('card_updated', handleCardUpdated);
      socket.off('card_moved', handleCardMoved);
      socket.off('card_deleted', handleCardDeleted);
      socket.off('cards_reordered', handleCardsReordered);
      socket.off('presence_update', handlePresenceUpdate);
    };
  }, [queryClient]);

  return { status, onlineCount };
}
