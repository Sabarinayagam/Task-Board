'use client';

import { useState } from 'react';

interface Props {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddCardButton({ onAdd, disabled }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');

  function submit() {
    const trimmed = title.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setTitle('');
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      // <button
      //   type="button"
      //   onClick={() => setIsEditing(true)}
      //   disabled={disabled}
      //   className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      // >
      //   + Add card
      // </button>
      <button
      type="button"
      onClick={() => setIsEditing(true)}
      disabled={disabled}
      className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add card
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTitle('');
          }
        }}
        placeholder="Enter a title for this card..."
        className="w-full resize-none rounded border-0 p-1 text-sm focus:outline-none focus:ring-0"
        rows={2}
      />
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setTitle('');
          }}
          className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
