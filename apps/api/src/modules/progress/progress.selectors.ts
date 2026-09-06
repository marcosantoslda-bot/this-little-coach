import type { Prisma } from '@tlc/database';

export const recordInclude = {
  exercise: { select: { id: true, name: true, translations: true } },
} satisfies Prisma.PersonalRecordInclude;
export type RecordRow = Prisma.PersonalRecordGetPayload<{ include: typeof recordInclude }>;

/** Sessão concluída, reduzida ao que as estatísticas semanais precisam. */
export const weekSessionSelect = {
  id: true,
  completedAt: true,
  durationSec: true,
  estimatedCalories: true,
  sets: { select: { skipped: true, exercise: { select: { movementPattern: true } } } },
} satisfies Prisma.WorkoutSessionSelect;
export type WeekSessionRow = Prisma.WorkoutSessionGetPayload<{ select: typeof weekSessionSelect }>;
