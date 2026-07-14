'use client';

import { ConnectionStatus as Status } from '@/hooks/useSocket';

interface Props {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string }> = {
  connected: { label: 'Connected', dot: 'bg-green-500' },
  reconnecting: { label: 'Reconnecting', dot: 'bg-yellow-500 animate-pulse' },
  disconnected: { label: 'Disconnected', dot: 'bg-red-500' },
};

export function ConnectionStatus({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium shadow-sm ring-1 ring-slate-200">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </div>
  );
}
