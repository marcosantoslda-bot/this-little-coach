import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => {
        // Não repetir erros de autenticação/validação; repetir rede até 2x.
        if (isApiError(error) && !error.isNetwork && error.statusCode < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: 0 },
  },
});
