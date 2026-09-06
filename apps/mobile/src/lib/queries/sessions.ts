import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paginatedSchema,
  sessionSchema,
  sessionSummarySchema,
  type CompleteSessionInput,
  type Session,
  type SessionSet,
  type SessionStatus,
  type StartSessionInput,
} from '@tlc/shared';
import { api } from '../api';
import { keys } from './keys';

const sessionPageSchema = paginatedSchema(sessionSummarySchema);

export interface SessionListFilters {
  status?: SessionStatus;
  limit?: number;
}

export function useSessions(filters: SessionListFilters = {}) {
  return useInfiniteQuery({
    queryKey: keys.sessions(filters),
    queryFn: ({ pageParam }) =>
      api.get('/sessions', sessionPageSchema, {
        status: filters.status,
        limit: filters.limit ?? 20,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: keys.session(id ?? ''),
    queryFn: () => api.get(`/sessions/${id}`, sessionSchema),
    enabled: !!id,
  });
}

function invalidateAfterSession(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['sessions'] });
  void qc.invalidateQueries({ queryKey: ['progress'] });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartSessionInput) => api.post('/sessions', input, sessionSchema),
    onSuccess: (session) => {
      qc.setQueryData<Session>(keys.session(session.id), session);
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/** Chamado pelo store offline; não usa React Query para poder correr fora de componentes. */
export function logSets(sessionId: string, sets: SessionSet[]): Promise<void> {
  return api.post(`/sessions/${sessionId}/sets`, { sets });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompleteSessionInput }) =>
      api.post(`/sessions/${id}/complete`, input, sessionSchema),
    onSuccess: (session) => {
      qc.setQueryData<Session>(keys.session(session.id), session);
      invalidateAfterSession(qc);
    },
  });
}

export function useAbandonSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/sessions/${id}/abandon`),
    onSuccess: () => invalidateAfterSession(qc),
  });
}
