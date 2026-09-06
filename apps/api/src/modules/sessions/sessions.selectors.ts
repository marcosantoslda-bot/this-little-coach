import type { Prisma } from '@tlc/database';

export const sessionInclude = {
  sets: { orderBy: [{ blockOrder: 'asc' }, { round: 'asc' }, { order: 'asc' }] },
  /** Recordes conquistados nesta sessão (ainda em vigor). */
  personalRecords: { include: { exercise: { select: { id: true, name: true, translations: true } } } },
} satisfies Prisma.WorkoutSessionInclude;
export type SessionRow = Prisma.WorkoutSessionGetPayload<{ include: typeof sessionInclude }>;

export const sessionSummaryInclude = {
  _count: { select: { sets: true } },
} satisfies Prisma.WorkoutSessionInclude;
export type SessionSummaryRow = Prisma.WorkoutSessionGetPayload<{ include: typeof sessionSummaryInclude }>;

/** Séries com o exercício (MET + nome) — para calorias e recordes. */
export const setWithExerciseInclude = {
  exercise: { select: { id: true, name: true, metValue: true, translations: true } },
} satisfies Prisma.SessionSetInclude;
export type SetWithExerciseRow = Prisma.SessionSetGetPayload<{ include: typeof setWithExerciseInclude }>;
