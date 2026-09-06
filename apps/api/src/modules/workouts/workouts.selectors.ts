import type { Prisma } from '@tlc/database';
import { exerciseInclude } from '../exercises/exercises.selectors';

/** Treino completo: blocos -> exercícios -> exercício (localizável). */
export const workoutFullInclude = {
  blocks: {
    orderBy: { order: 'asc' },
    include: {
      exercises: { orderBy: { order: 'asc' }, include: { exercise: { include: exerciseInclude } } },
    },
  },
} satisfies Prisma.WorkoutInclude;
export type WorkoutFullRow = Prisma.WorkoutGetPayload<{ include: typeof workoutFullInclude }>;

/** Versão leve para listas: só a contagem de exercícios por bloco. */
export const workoutSummaryInclude = {
  blocks: { select: { _count: { select: { exercises: true } } } },
} satisfies Prisma.WorkoutInclude;
export type WorkoutSummaryRow = Prisma.WorkoutGetPayload<{ include: typeof workoutSummaryInclude }>;
