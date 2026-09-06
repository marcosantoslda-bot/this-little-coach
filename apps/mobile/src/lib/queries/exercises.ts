import { useQueries, useQuery } from '@tanstack/react-query';
import { exerciseSchema, paginatedSchema, type Exercise } from '@tlc/shared';
import { api } from '../api';
import { keys } from './keys';

const exercisePageSchema = paginatedSchema(exerciseSchema);

export function useExercise(id: string | null | undefined) {
  return useQuery({
    queryKey: keys.exercise(id ?? ''),
    queryFn: () => api.get(`/exercises/${id}`, exerciseSchema),
    enabled: !!id,
    staleTime: 60 * 60_000,
  });
}

/** Vários exercícios por id (variantes mais fáceis / mais difíceis). */
export function useExercisesByIds(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.exercise(id),
      queryFn: () => api.get(`/exercises/${id}`, exerciseSchema),
      staleTime: 60 * 60_000,
    })),
    combine: (results) => ({
      exercises: results.map((r) => r.data).filter((e): e is Exercise => !!e),
      isLoading: results.some((r) => r.isLoading),
    }),
  });
}

export function useExercises(query: { search?: string; maxDifficulty?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: keys.exercises(query),
    queryFn: () => api.get('/exercises', exercisePageSchema, query),
    staleTime: 10 * 60_000,
  });
}
