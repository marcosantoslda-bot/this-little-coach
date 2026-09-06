/** Chaves do React Query, centralizadas para invalidação consistente. */
export const keys = {
  me: ['me'] as const,
  exercises: (query?: object) => ['exercises', query ?? {}] as const,
  exercise: (id: string) => ['exercise', id] as const,
  workouts: (query?: object) => ['workouts', query ?? {}] as const,
  workout: (id: string) => ['workout', id] as const,
  sessions: (query?: object) => ['sessions', query ?? {}] as const,
  session: (id: string) => ['session', id] as const,
  progressOverview: ['progress', 'overview'] as const,
  measurements: ['progress', 'measurements'] as const,
  records: ['progress', 'records'] as const,
};
