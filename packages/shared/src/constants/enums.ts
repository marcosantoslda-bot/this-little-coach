/**
 * Espelho dos enums do Prisma (packages/database/prisma/schema.prisma).
 * Mantido à mão para que a app mobile não dependa de @prisma/client.
 * Se alterares um enum no schema, altera-o aqui também (há um teste que compara).
 */

export const USER_ROLES = ['MEMBER', 'COACH', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SEXES = ['FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export type Sex = (typeof SEXES)[number];

export const FITNESS_GOALS = ['LOSE_FAT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_ENDURANCE', 'GENERAL_HEALTH'] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const FITNESS_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE'] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];

export const TRAINING_FOCUSES = ['BALANCED', 'LOWER_BODY_GLUTES', 'UPPER_BODY_ARMS', 'CORE', 'CARDIO'] as const;
export type TrainingFocus = (typeof TRAINING_FOCUSES)[number];

export const TRAINING_LOCATIONS = ['HOME', 'GYM', 'OUTDOOR', 'ANYWHERE'] as const;
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export const TRAINING_MODES = ['NORMAL', 'VACATION', 'PAUSED', 'SICK', 'RECOVERING'] as const;
export type TrainingMode = (typeof TRAINING_MODES)[number];

export const EQUIPMENT = [
  'NONE', 'MAT', 'PULL_UP_BAR', 'RESISTANCE_BAND', 'DUMBBELLS', 'KETTLEBELL', 'BARBELL', 'BENCH',
  'CABLE_MACHINE', 'MACHINE', 'JUMP_ROPE', 'PLYO_BOX', 'TREADMILL', 'BIKE', 'ROWER',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const MUSCLE_GROUPS = [
  'CHEST', 'LATS', 'UPPER_BACK', 'LOWER_BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE',
  'OBLIQUES', 'GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES', 'HIP_FLEXORS', 'ADDUCTORS', 'ABDUCTORS',
  'FULL_BODY', 'CARDIOVASCULAR',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MOVEMENT_PATTERNS = [
  'PUSH_HORIZONTAL', 'PUSH_VERTICAL', 'PULL_HORIZONTAL', 'PULL_VERTICAL', 'SQUAT', 'HINGE', 'LUNGE',
  'CARRY', 'ROTATION', 'ANTI_ROTATION', 'LOCOMOTION', 'JUMP', 'ISOMETRIC',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const EXERCISE_CATEGORIES = ['STRENGTH', 'CARDIO', 'PLYOMETRIC', 'MOBILITY', 'STRETCH', 'CORE'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EXERCISE_METRICS = ['REPS', 'DURATION', 'DISTANCE', 'CALORIES'] as const;
export type ExerciseMetric = (typeof EXERCISE_METRICS)[number];

export const WORKOUT_FOCUSES = ['FULL_BODY', 'UPPER_BODY', 'LOWER_BODY', 'PUSH', 'PULL', 'LEGS', 'CORE', 'CARDIO', 'MOBILITY'] as const;
export type WorkoutFocus = (typeof WORKOUT_FOCUSES)[number];

export const WORKOUT_FORMATS = ['STRAIGHT_SETS', 'SUPERSET', 'CIRCUIT', 'AMRAP', 'EMOM', 'FOR_TIME', 'TABATA', 'INTERVAL'] as const;
export type WorkoutFormat = (typeof WORKOUT_FORMATS)[number];

export const WORKOUT_SOURCES = ['SYSTEM', 'GENERATED', 'USER'] as const;
export type WorkoutSource = (typeof WORKOUT_SOURCES)[number];

export const BLOCK_TYPES = ['WARMUP', 'MAIN', 'FINISHER', 'COOLDOWN'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const SESSION_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_SOURCES = ['APP', 'MANUAL', 'IMPORTED'] as const;
export type SessionSource = (typeof SESSION_SOURCES)[number];

export const SET_ADJUSTMENT_REASONS = ['NONE', 'TOO_HARD', 'TOO_EASY', 'PAIN', 'OUT_OF_TIME', 'EQUIPMENT_MISSING', 'OTHER'] as const;
export type SetAdjustmentReason = (typeof SET_ADJUSTMENT_REASONS)[number];

export const RECORD_METRICS = ['MAX_REPS', 'MAX_DURATION_SEC', 'MAX_LOAD_KG', 'FASTEST_TIME_SEC', 'MAX_DISTANCE_M'] as const;
export type RecordMetric = (typeof RECORD_METRICS)[number];

export const MEASUREMENT_SOURCES = ['MANUAL', 'IMPORTED'] as const;
export type MeasurementSource = (typeof MEASUREMENT_SOURCES)[number];
