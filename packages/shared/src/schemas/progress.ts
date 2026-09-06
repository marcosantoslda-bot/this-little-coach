import { z } from 'zod';
import { MEASUREMENT_SOURCES, MOVEMENT_PATTERNS, RECORD_METRICS } from '../constants/enums';
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from './common';

export const bodyMeasurementSchema = z.object({
  id: uuidSchema,
  measuredAt: isoDateSchema,
  source: z.enum(MEASUREMENT_SOURCES),
  weightKg: z.number().nullable(),
  bodyFatPct: z.number().nullable(),
  waistCm: z.number().nullable(),
  hipCm: z.number().nullable(),
  chestCm: z.number().nullable(),
  notes: z.string().nullable(),
});
export type BodyMeasurement = z.infer<typeof bodyMeasurementSchema>;

/** PUT /progress/measurements — upsert por dia. */
export const upsertBodyMeasurementSchema = z.object({
  measuredAt: isoDateSchema,
  weightKg: z.number().min(25).max(300).nullable().default(null),
  bodyFatPct: z.number().min(2).max(70).nullable().default(null),
  waistCm: z.number().min(40).max(200).nullable().default(null),
  hipCm: z.number().min(40).max(200).nullable().default(null),
  chestCm: z.number().min(40).max(200).nullable().default(null),
  notes: z.string().max(300).nullable().default(null),
});
export type UpsertBodyMeasurementInput = z.infer<typeof upsertBodyMeasurementSchema>;

export const personalRecordSchema = z.object({
  exerciseId: uuidSchema,
  exerciseName: z.string(),
  metric: z.enum(RECORD_METRICS),
  value: z.number(),
  achievedAt: isoDateTimeSchema,
  sessionId: uuidSchema.nullable(),
});
export type PersonalRecord = z.infer<typeof personalRecordSchema>;

/** GET /progress/overview — o que o ecrã de progresso mostra. */
export const progressOverviewSchema = z.object({
  week: z.object({
    sessionsCompleted: z.number().int(),
    sessionsTarget: z.number().int(),
    totalMinutes: z.number().int(),
    totalSets: z.number().int(),
    estimatedCalories: z.number().int(),
    /** Séries por padrão de movimento — para mostrar equilíbrio. */
    setsByPattern: z.record(z.enum(MOVEMENT_PATTERNS), z.number().int()),
  }),
  streakWeeks: z.number().int(),
  latestWeightKg: z.number().nullable(),
  weightTrend7d: z.number().nullable(),
  targetWeightKg: z.number().nullable(),
  recentRecords: z.array(personalRecordSchema),
  /** Últimos 90 dias de peso para o gráfico. */
  weightHistory: z.array(z.object({ date: isoDateSchema, weightKg: z.number() })),
});
export type ProgressOverview = z.infer<typeof progressOverviewSchema>;
