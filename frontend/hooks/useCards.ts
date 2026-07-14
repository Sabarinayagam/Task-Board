'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardApi } from '@/services/api';
import { CARDS_QUERY_KEY } from '@/lib/queryClient';
import { Card, CardStatus, ReorderItem } from '@/types';

// Centralizes all card data-fetching + mutations behind React Query, with
// optimistic updates so the UI feels instant while the request is in
// flight. Socket.IO events (see useSocket) keep the cache in sync with
// changes made by *other* clients.
export function useCards() {
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: CARDS_QUERY_KEY,
    queryFn: cardApi.getAll,
  });

  async function cancelAndSnapshot() {
    await queryClient.cancelQueries({ queryKey: CARDS_QUERY_KEY });
    return queryClient.getQueryData<Card[]>(CARDS_QUERY_KEY);
  }

  function rollback(snapshot: Card[] | undefined) {
    if (snapshot) {
      queryClient.setQueryData(CARDS_QUERY_KEY, snapshot);
    }
  }

  const createCard = useMutation({
    mutationFn: ({ title, status }: { title: string; status?: CardStatus }) =>
      cardApi.create(title, status),
    onMutate: async ({ title, status }) => {
      const previous = await cancelAndSnapshot();
      const optimisticCard: Card = {
        id: `optimistic-${Date.now()}`,
        title,
        status: status ?? 'TODO',
        position: Number.MAX_SAFE_INTEGER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) => [...old, optimisticCard]);
      return { previous, optimisticId: optimisticCard.id };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
    onSuccess: (created, _vars, context) => {
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === context?.optimisticId ? created : c))
      );
    },
  });

  const renameCard = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => cardApi.rename(id, title),
    onMutate: async ({ id, title }) => {
      const previous = await cancelAndSnapshot();
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, title } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
  });

  const moveCard = useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: CardStatus; position?: number }) =>
      cardApi.updateStatus(id, status, position),
    onMutate: async ({ id, status, position }) => {
      const previous = await cancelAndSnapshot();
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, status, position: position ?? c.position } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
  });

  const deleteCard = useMutation({
    mutationFn: (id: string) => cardApi.remove(id),
    onMutate: async (id) => {
      const previous = await cancelAndSnapshot();
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) => old.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
  });

  const reorderCards = useMutation({
    mutationFn: (items: ReorderItem[]) => cardApi.reorder(items),
    onMutate: async (items) => {
      const previous = await cancelAndSnapshot();
      const byId = new Map(items.map((i) => [i.id, i]));
      queryClient.setQueryData<Card[]>(CARDS_QUERY_KEY, (old = []) =>
        old.map((c) => {
          const update = byId.get(c.id);
          return update ? { ...c, status: update.status, position: update.position } : c;
        })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    createCard,
    renameCard,
    moveCard,
    deleteCard,
    reorderCards,
  };
}
