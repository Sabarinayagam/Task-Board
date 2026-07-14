'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@/types';

interface Props {
  card: CardType;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function Card({ card, onRename, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(card.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { status: card.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function commitRename() {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== card.title) {
      onRename(card.id, trimmed);
    } else {
      setDraftTitle(card.title);
    }
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitRename();
            } else if (e.key === 'Escape') {
              setDraftTitle(card.title);
              setIsEditing(false);
            }
          }}
          className="w-full resize-none rounded border border-blue-300 p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          rows={2}
        />
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p
            {...attributes}
            {...listeners}
            onClick={() => setIsEditing(true)}
            className="flex-1 cursor-grab select-none text-sm text-slate-800 active:cursor-grabbing"
          >
            {card.title}
          </p>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              aria-label="Edit card"
              onClick={() => setIsEditing(true)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ✏️
            </button>
            <button
              type="button"
              aria-label="Delete card"
              onClick={() => onDelete(card.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
