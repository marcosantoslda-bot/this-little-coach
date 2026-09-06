import { z } from 'zod';
import {
  BLOCK_TYPES, EQUIPMENT, WORKOUT_FOCUSES, WORKOUT_FORMATS, WORKOUT_SOURCES,
} from '../constants/enums';
import { exerciseSchema } from './exercise';
import { isoDateTimeSchema, paginationQuerySchema, uuidSchema } from './common';

const targetFields = {
  targetReps: z.number().int().min(1).max(500).nullable(),
  targetDurationSec: z.number().int().min(1).max(3600).nullable(),
  targetDistanceM: z.number().int().min(1).max(100000).nullable(),
  targetLoadKg: z.number().min(0).max(500).nullable(),
  restAfterSec: z.number().int().min(0).max(600).nullable(),
  tempo: z.string().max(12).nullable(),
  notes: z.string().max(300).nullable(),
};

export const workoutExerciseSchema = z.object({
  id: uuidSchema,
  order: z.number().int().min(0),
  exercise: exerciseSchema,
  ...targetFields,
});
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

export const workoutBlockSchema = z.object({
  id: uuidSchema,
  order: z.number().int().min(0),
  type: z.enum(BLOCK_TYPES),
  format: z.enum(WORKOUT_FORMATS),
  name: z.string().nullable(),
  rounds: z.number().int().min(1).max(50),
  timeCapSec: z.number().int().min(10).max(7200).nullable(),
  restBetweenExercisesSec: z.number().int().min(0).max(600),
  restBetweenRoundsSec: z.number().int().min(0).max(600),
  notes: z.string().nullable(),
  exercises: z.array(workoutExerciseSchema),
});
export type WorkoutBlock = z.infer<typeof workoutBlockSchema>;

export const workoutSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  focus: z.enum(WORKOUT_FOCUSES),
  difficulty: z.number().int().min(1).max(5),
  estimatedDurationMin: z.number().int().min(1),
  requiredEquipment: z.array(z.enum(EQUIPMENT)),
  source: z.enum(WORKOUT_SOURCES),
  createdById: uuidSchema.nullable(),
  /** Frases curtas que explicam porque é que o treino é assim ("treino explicável"). */
  explanation: z.array(z.string()),
  blocks: z.array(workoutBlockSchema),
  createdAt: isoDateTimeSchema,
});
export type Workout = z.infer<typeof workoutSchema>;

/** Versão leve para listas. */
export const workoutSummarySchema = workoutSchema.omit({ blocks: true, explanation: true }).extend({
  exerciseCount: z.number().int().min(0),
});
export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;

export const workoutQuerySchema = paginationQuerySchema.extend({
  source: z.enum(WORKOUT_SOURCES).optional(),
  focus: z.enum(WORKOUT_FOCUSES).optional(),
  maxDurationMin: z.coerce.number().int().min(5).max(180).optional(),
});
export type WorkoutQuery = z.infer<typeof workoutQuerySchema>;

/** POST /workouts/generate — "treino de hoje". */
export const generateWorkoutSchema = z.object({
  availableMinutes: z.number().int().min(10).max(90),
  /** Como te sentes hoje? 1 = sem energia, 5 = cheio de energia. */
  energyLevel: z.number().int().min(1).max(5).default(3),
  /** Equipamento à mão agora (por defeito, o do perfil). */
  equipment: z.array(z.enum(EQUIPMENT)).min(1).optional(),
  focus: z.enum(WORKOUT_FOCUSES).optional(),
  /** Semente para reprodutibilidade; se omitida a API gera uma. */
  seed: z.number().int().optional(),
});
export type GenerateWorkoutInput = z.infer<typeof generateWorkoutSchema>;

/** POST /workouts — treino criado manualmente pelo utilizador. */
export const createWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500).nullable().default(null),
  focus: z.enum(WORKOUT_FOCUSES),
  blocks: z
    .array(
      z.object({
        type: z.enum(BLOCK_TYPES).default('MAIN'),
        format: z.enum(WORKOUT_FORMATS).default('STRAIGHT_SETS'),
        name: z.string().max(60).nullable().default(null),
        rounds: z.number().int().min(1).max(50).default(3),
        timeCapSec: z.number().int().min(10).max(7200).nullable().default(null),
        restBetweenExercisesSec: z.number().int().min(0).max(600).default(0),
        restBetweenRoundsSec: z.number().int().min(0).max(600).default(60),
        exercises: z
          .array(
            z.object({
              exerciseId: uuidSchema,
              targetReps: targetFields.targetReps.default(null),
              targetDurationSec: targetFields.targetDurationSec.default(null),
              targetDistanceM: targetFields.targetDistanceM.default(null),
              targetLoadKg: targetFields.targetLoadKg.default(null),
              restAfterSec: targetFields.restAfterSec.default(null),
              tempo: targetFields.tempo.default(null),
              notes: targetFields.notes.default(null),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
