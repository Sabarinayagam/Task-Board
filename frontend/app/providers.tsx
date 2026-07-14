'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures the QueryClient is created once per browser session
  // (and not recreated on every render), while still being safe for SSR
  // since each request on the server would get its own instance.
  const [queryClient] = useState<QueryClient>(() => makeQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
