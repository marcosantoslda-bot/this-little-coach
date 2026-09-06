import { z } from 'zod';
import {
  EQUIPMENT, FITNESS_GOALS, FITNESS_LEVELS, MUSCLE_GROUPS, SEXES, TRAINING_FOCUSES,
  TRAINING_LOCATIONS, TRAINING_MODES, USER_ROLES,
} from '../constants/enums';
import { isoDateSchema, isoDateTimeSchema, localeSchema, uuidSchema } from './common';

export const userSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  locale: localeSchema,
  timezone: z.string(),
  role: z.enum(USER_ROLES),
  createdAt: isoDateTimeSchema,
});
export type User = z.infer<typeof userSchema>;

export const profileSchema = z.object({
  sex: z.enum(SEXES).nullable(),
  birthDate: isoDateSchema.nullable(),
  heightCm: z.number().int().min(100).max(250).nullable(),
  startingWeightKg: z.number().min(25).max(300).nullable(),
  targetWeightKg: z.number().min(25).max(300).nullable(),
  bodyFatPct: z.number().min(2).max(70).nullable(),
  goal: z.enum(FITNESS_GOALS),
  fitnessLevel: z.enum(FITNESS_LEVELS),
  focus: z.enum(TRAINING_FOCUSES),
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  preferredSessionMinutes: z.number().int().min(10).max(120),
  preferredLocation: z.enum(TRAINING_LOCATIONS),
  availableEquipment: z.array(z.enum(EQUIPMENT)),
  activeMode: z.enum(TRAINING_MODES),
  restrictedMuscles: z.array(z.enum(MUSCLE_GROUPS)),
  limitationsNote: z.string().max(500).nullable(),
  onboardingCompletedAt: isoDateTimeSchema.nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

/** Resposta de GET /me: utilizador + perfil. */
export const meSchema = z.object({
  user: userSchema,
  profile: profileSchema,
});
export type Me = z.infer<typeof meSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  locale: localeSchema.optional(),
  timezone: z.string().min(1).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** PATCH /me/profile — todos os campos opcionais (onboarding progressivo). */
export const updateProfileSchema = profileSchema
  .omit({ onboardingCompletedAt: true })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** POST /me/onboarding — o mínimo para gerar o primeiro treino. */
export const completeOnboardingSchema = z.object({
  goal: z.enum(FITNESS_GOALS),
  fitnessLevel: z.enum(FITNESS_LEVELS),
  availableEquipment: z.array(z.enum(EQUIPMENT)).min(1),
  preferredSessionMinutes: z.number().int().min(10).max(120),
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  focus: z.enum(TRAINING_FOCUSES).default('BALANCED'),
  preferredLocation: z.enum(TRAINING_LOCATIONS).default('HOME'),
});
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
