'use client';

import { ConnectionStatus as Status } from '@/hooks/useSocket';
import { ConnectionStatus } from './ConnectionStatus';

interface Props {
  status: Status;
  onlineCount: number;
}

export function Header({ status, onlineCount }: Props) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Real-Time Task Board</h1>
        {/* <p className="text-sm text-slate-500">Shared with everyone viewing this page</p> */}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
          <span>{onlineCount}</span>
          <span>{onlineCount === 1 ? 'user online' : 'users online'}</span>
        </div>
        <ConnectionStatus status={status} />
      </div>
    </header>
  );
}
