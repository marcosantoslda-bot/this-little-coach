/**
 * Sessão ativa + fila offline de séries.
 * Cada série tem um UUID gerado no cliente (idempotente); é guardada aqui primeiro
 * e enviada em lotes para POST /sessions/:id/sets. Se falhar, fica na fila e volta
 * a tentar (ao registar a próxima série, ao voltar à app e ao concluir a sessão).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, SessionSet } from '@tlc/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { logSets } from '@/lib/queries/sessions';

export interface PlayerPosition {
  stepIndex: number;
}

export interface ActiveSession {
  id: string;
  workoutName: string;
  startedAt: string;
  position: PlayerPosition;
  /** Exercício substituído por posição "blockOrder:order" → exercício novo. */
  substitutions: Record<string, Exercise>;
}

interface SessionStoreState {
  active: ActiveSession | null;
  /** Séries por sessão ainda não confirmadas pela API. */
  queue: Record<string, SessionSet[]>;
  flushing: boolean;
  lastFlushError: string | null;

  startActive: (input: Omit<ActiveSession, 'position' | 'substitutions'>) => void;
  setPosition: (position: PlayerPosition) => void;
  substitute: (key: string, exercise: Exercise) => void;
  clearActive: () => void;

  enqueueSet: (sessionId: string, set: SessionSet) => void;
  pendingFor: (sessionId: string) => SessionSet[];
  /** Envia a fila da sessão em lotes de até 50. Devolve true se ficou vazia. */
  flush: (sessionId: string) => Promise<boolean>;
  discardQueue: (sessionId: string) => void;
}

const BATCH = 50;

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      active: null,
      queue: {},
      flushing: false,
      lastFlushError: null,

      startActive: (input) =>
        set({ active: { ...input, position: { stepIndex: 0 }, substitutions: {} } }),

      setPosition: (position) =>
        set((s) => (s.active ? { active: { ...s.active, position } } : {})),

      substitute: (key, exercise) =>
        set((s) =>
          s.active ? { active: { ...s.active, substitutions: { ...s.active.substitutions, [key]: exercise } } } : {},
        ),

      clearActive: () => set({ active: null }),

      enqueueSet: (sessionId, item) =>
        set((s) => {
          const current = s.queue[sessionId] ?? [];
          if (current.some((x) => x.id === item.id)) return {};
          return { queue: { ...s.queue, [sessionId]: [...current, item] } };
        }),

      pendingFor: (sessionId) => get().queue[sessionId] ?? [],

      flush: async (sessionId) => {
        if (get().flushing) return (get().queue[sessionId] ?? []).length === 0;
        set({ flushing: true, lastFlushError: null });
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const pending = get().queue[sessionId] ?? [];
            if (pending.length === 0) return true;
            const batch = pending.slice(0, BATCH);
            await logSets(sessionId, batch);
            const sent = new Set(batch.map((x) => x.id));
            set((s) => ({
              queue: { ...s.queue, [sessionId]: (s.queue[sessionId] ?? []).filter((x) => !sent.has(x.id)) },
            }));
          }
        } catch (e) {
          set({ lastFlushError: e instanceof Error ? e.message : 'Erro ao sincronizar' });
          return false;
        } finally {
          set({ flushing: false });
        }
      },

      discardQueue: (sessionId) =>
        set((s) => {
          const next = { ...s.queue };
          delete next[sessionId];
          return { queue: next };
        }),
    }),
    {
      name: 'tlc.session-store.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ active: s.active, queue: s.queue }),
    },
  ),
);

/** Reenvio com espera exponencial curta (usado no player). */
export async function flushWithRetry(sessionId: string, attempts = 3): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const ok = await useSessionStore.getState().flush(sessionId);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 500 * 2 ** i));
  }
  return false;
}
