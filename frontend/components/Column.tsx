'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card as CardType, CardStatus, COLUMN_LABELS } from '@/types';
import { Card } from './Card';
import { AddCardButton } from './AddCardButton';

interface Props {
  status: CardStatus;
  cards: CardType[];
  onAddCard: (title: string, status: CardStatus) => void;
  onRenameCard: (id: string, title: string) => void;
  onDeleteCard: (id: string) => void;
}

const COLUMN_ACCENT: Record<CardStatus, string> = {
  TODO: 'border-t-todo',
  IN_PROGRESS: 'border-t-inprogress',
  DONE: 'border-t-done',
};

export function Column({ status, cards, onAddCard, onRenameCard, onDeleteCard }: Props) {
  // Registers this column as a drop target. An empty column still needs to
  // be droppable, so we give it a stable id derived from the status.
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <section
      className={`flex w-full flex-col rounded-xl border-t-4 bg-slate-50 p-3 shadow-sm ${COLUMN_ACCENT[status]}`}
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {COLUMN_LABELS[status]}
        </h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          {cards.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} onRename={onRenameCard} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>

      <AddCardButton onAdd={(title) => onAddCard(title, status)} />
    </section>
  );
}
