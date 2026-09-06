import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paginatedSchema,
  workoutSchema,
  workoutSummarySchema,
  type GenerateWorkoutInput,
  type Workout,
  type WorkoutFocus,
  type WorkoutSource,
} from '@tlc/shared';
import { api } from '../api';
import { keys } from './keys';

const workoutPageSchema = paginatedSchema(workoutSummarySchema);

export interface WorkoutListFilters {
  focus?: WorkoutFocus;
  maxDurationMin?: number;
  source?: WorkoutSource;
}

export function useWorkouts(filters: WorkoutListFilters = {}) {
  return useInfiniteQuery({
    queryKey: keys.workouts(filters),
    queryFn: ({ pageParam }) =>
      api.get('/workouts', workoutPageSchema, { ...filters, limit: 20, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: keys.workout(id ?? ''),
    queryFn: () => api.get(`/workouts/${id}`, workoutSchema),
    enabled: !!id,
  });
}

export function useGenerateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateWorkoutInput) => api.post('/workouts/generate', input, workoutSchema),
    onSuccess: (workout) => {
      qc.setQueryData<Workout>(keys.workout(workout.id), workout);
      void qc.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workouts/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workouts'] }),
  });
}
