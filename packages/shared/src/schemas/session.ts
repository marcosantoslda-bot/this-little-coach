import { z } from 'zod';
import { SESSION_SOURCES, SESSION_STATUSES, SET_ADJUSTMENT_REASONS } from '../constants/enums';
import { isoDateTimeSchema, paginationQuerySchema, uuidSchema } from './common';
import { workoutSchema } from './workout';

export const sessionSetSchema = z.object({
  /** Gerado no cliente (UUID v4) para permitir sincronização offline idempotente. */
  id: uuidSchema,
  exerciseId: uuidSchema,
  workoutExerciseId: uuidSchema.nullable().default(null),
  blockOrder: z.number().int().min(0),
  round: z.number().int().min(1).default(1),
  order: z.number().int().min(0),
  targetReps: z.number().int().min(0).nullable().default(null),
  targetDurationSec: z.number().int().min(0).nullable().default(null),
  repsCompleted: z.number().int().min(0).max(1000).nullable().default(null),
  durationSec: z.number().int().min(0).max(7200).nullable().default(null),
  distanceM: z.number().int().min(0).nullable().default(null),
  loadKg: z.number().min(0).max(500).nullable().default(null),
  rpe: z.number().int().min(1).max(10).nullable().default(null),
  skipped: z.boolean().default(false),
  adjustmentReason: z.enum(SET_ADJUSTMENT_REASONS).default('NONE'),
  substitutedFromId: uuidSchema.nullable().default(null),
  completedAt: isoDateTimeSchema,
});
export type SessionSet = z.infer<typeof sessionSetSchema>;

/** POST /sessions/:id/sets — aceita 1..N séries (batch para sincronização). */
export const logSetsSchema = z.object({
  sets: z.array(sessionSetSchema).min(1).max(200),
});
export type LogSetsInput = z.infer<typeof logSetsSchema>;

/** POST /sessions — iniciar. `workoutId` nulo = treino livre. */
export const startSessionSchema = z.object({
  workoutId: uuidSchema.nullable().default(null),
  energyBefore: z.number().int().min(1).max(5).nullable().default(null),
  startedAt: isoDateTimeSchema.optional(),
});
export type StartSessionInput = z.infer<typeof startSessionSchema>;

/** POST /sessions/:id/complete */
export const completeSessionSchema = z.object({
  durationSec: z.number().int().min(0).max(4 * 3600),
  rpe: z.number().int().min(1).max(10).nullable().default(null),
  moodAfter: z.number().int().min(1).max(5).nullable().default(null),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  notes: z.string().max(500).nullable().default(null),
  completedAt: isoDateTimeSchema.optional(),
  /** Séries ainda não enviadas (modo offline). */
  sets: z.array(sessionSetSchema).max(200).optional(),
});
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;

export const sessionSchema = z.object({
  id: uuidSchema,
  workoutId: uuidSchema.nullable(),
  /** Snapshot do treino no momento (sem `id`s de bloco/exercício obrigatórios). */
  workout: workoutSchema.pick({ name: true, focus: true, difficulty: true, estimatedDurationMin: true, blocks: true }),
  status: z.enum(SESSION_STATUSES),
  source: z.enum(SESSION_SOURCES),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.nullable(),
  durationSec: z.number().int().nullable(),
  energyBefore: z.number().int().nullable(),
  rpe: z.number().int().nullable(),
  moodAfter: z.number().int().nullable(),
  rating: z.number().int().nullable(),
  notes: z.string().nullable(),
  estimatedCalories: z.number().int().nullable(),
  sets: z.array(sessionSetSchema),
  /** Recordes batidos nesta sessão (preenchido ao completar). */
  newRecords: z.array(z.object({ exerciseId: uuidSchema, exerciseName: z.string(), metric: z.string(), value: z.number() })),
});
export type Session = z.infer<typeof sessionSchema>;

export const sessionSummarySchema = sessionSchema.omit({ workout: true, sets: true, newRecords: true }).extend({
  workoutName: z.string(),
  focus: workoutSchema.shape.focus,
  setCount: z.number().int(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionQuerySchema = paginationQuerySchema.extend({
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
  status: z.enum(SESSION_STATUSES).optional(),
});
export type SessionQuery = z.infer<typeof sessionQuerySchema>;
