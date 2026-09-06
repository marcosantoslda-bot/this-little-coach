import { z } from 'zod';
import {
  EQUIPMENT, EXERCISE_CATEGORIES, EXERCISE_METRICS, MOVEMENT_PATTERNS, MUSCLE_GROUPS,
} from '../constants/enums';
import { paginationQuerySchema, uuidSchema } from './common';

/** Exercício tal como a API o devolve, já localizado para o `locale` do utilizador. */
export const exerciseSchema = z.object({
  id: uuidSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cues: z.array(z.string()),
  category: z.enum(EXERCISE_CATEGORIES),
  movementPattern: z.enum(MOVEMENT_PATTERNS),
  primaryMuscles: z.array(z.enum(MUSCLE_GROUPS)),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)),
  equipment: z.array(z.enum(EQUIPMENT)),
  difficulty: z.number().int().min(1).max(5),
  metric: z.enum(EXERCISE_METRICS),
  isUnilateral: z.boolean(),
  metValue: z.number().nullable(),
  defaultTempo: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  /** Variantes mais fáceis / mais difíceis (ids). */
  easierIds: z.array(uuidSchema),
  harderIds: z.array(uuidSchema),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const exerciseQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(60).optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  movementPattern: z.enum(MOVEMENT_PATTERNS).optional(),
  muscle: z.enum(MUSCLE_GROUPS).optional(),
  /** Só exercícios exequíveis com este equipamento (lista separada por vírgulas). */
  equipment: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.enum(EQUIPMENT)))
    .optional(),
  maxDifficulty: z.coerce.number().int().min(1).max(5).optional(),
});
export type ExerciseQuery = z.infer<typeof exerciseQuerySchema>;
