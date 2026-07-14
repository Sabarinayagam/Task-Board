'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSocket } from '@/hooks/useSocket';
import { useCards } from '@/hooks/useCards';
import { Card as CardType, CardStatus, COLUMN_ORDER, ReorderItem } from '@/types';
import { Header } from './Header';
import { Column } from './Column';
import { Card } from './Card';

function groupByStatus(cards: CardType[]): Record<CardStatus, CardType[]> {
  const groups: Record<CardStatus, CardType[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const status of COLUMN_ORDER) {
    groups[status] = cards
      .filter((c) => c.status === status)
      .sort((a, b) => a.position - b.position);
  }
  return groups;
}

function statusFromDroppableId(id: string): CardStatus | null {
  if (id.startsWith('column-')) {
    const status = id.replace('column-', '') as CardStatus;
    return COLUMN_ORDER.includes(status) ? status : null;
  }
  return null;
}

export function Board() {
  const { status, onlineCount } = useSocket();
  const { cards, createCard, renameCard, deleteCard, reorderCards } = useCards();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const groups = useMemo(() => groupByStatus(cards), [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeCardData = cards.find((c) => c.id === active.id);
    if (!activeCardData) return;

    const sourceStatus = activeCardData.status;

    // The drop target is either an empty column area (id "column-<STATUS>")
    // or another card (id === that card's id), in which case its column is
    // the destination.
    let destStatus = statusFromDroppableId(String(over.id));
    let destIndexHint: number | null = null;

    if (!destStatus) {
      const overCard = cards.find((c) => c.id === over.id);
      if (!overCard) return;
      destStatus = overCard.status;
      destIndexHint = groups[destStatus].findIndex((c) => c.id === overCard.id);
    }

    const workingGroups: Record<CardStatus, CardType[]> = {
      TODO: [...groups.TODO],
      IN_PROGRESS: [...groups.IN_PROGRESS],
      DONE: [...groups.DONE],
    };

    // Remove the dragged card from its source column.
    const sourceIndex = workingGroups[sourceStatus].findIndex((c) => c.id === active.id);
    if (sourceIndex === -1) return;
    const [moved] = workingGroups[sourceStatus].splice(sourceIndex, 1);

    const updatedCard: CardType = { ...moved, status: destStatus };
    const insertIndex = destIndexHint === null ? workingGroups[destStatus].length : destIndexHint;
    workingGroups[destStatus].splice(insertIndex, 0, updatedCard);

    // No-op guard: dropped back in the exact same place.
    if (
      sourceStatus === destStatus &&
      workingGroups[destStatus][insertIndex]?.id === active.id &&
      sourceIndex === insertIndex
    ) {
      return;
    }

    const affectedStatuses = sourceStatus === destStatus ? [destStatus] : [sourceStatus, destStatus];
    const reorderItems: ReorderItem[] = affectedStatuses.flatMap((s) =>
      workingGroups[s].map((c, index) => ({ id: c.id, status: s, position: index + 1 }))
    );

    reorderCards.mutate(reorderItems);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header status={status} onlineCount={onlineCount} />

      <div className="flex-1 overflow-x-auto p-4 sm:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COLUMN_ORDER.map((columnStatus) => (
              <Column
                key={columnStatus}
                status={columnStatus}
                cards={groups[columnStatus]}
                onAddCard={(title, s) => createCard.mutate({ title, status: s })}
                onRenameCard={(id, title) => renameCard.mutate({ id, title })}
                onDeleteCard={(id) => deleteCard.mutate(id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <Card card={activeCard} onRename={() => {}} onDelete={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
