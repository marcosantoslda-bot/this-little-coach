/**
 * Tipos dos dados de seed (catálogo de exercícios + treinos de sistema).
 *
 * Os enums vêm diretamente do cliente Prisma para que o compilador apanhe
 * qualquer valor inválido antes de chegar à base de dados.
 */
import type {
  BlockType,
  Equipment,
  ExerciseCategory,
  ExerciseMetric,
  MovementPattern,
  MuscleGroup,
  WorkoutFocus,
  WorkoutFormat,
} from '@prisma/client';

export const SEED_LOCALES = ['pt-PT', 'en-US'] as const;
export type SeedLocale = (typeof SEED_LOCALES)[number];

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface SeedExerciseTranslation {
  name: string;
  /** 1–2 frases: o que é e para que serve. */
  description: string;
  /** 2–3 dicas curtas mostradas durante o treino. Sem emoji. */
  cues: string[];
}

export interface SeedExercise {
  /** kebab-case em inglês, estável (é a chave do upsert). */
  slug: string;
  /** Nome canónico em inglês. */
  name: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** [NONE] = peso corporal puro. */
  equipment: Equipment[];
  difficulty: Difficulty;
  metric: ExerciseMetric;
  isUnilateral: boolean;
  /** MET aproximado (Compendium of Physical Activities) ou null se desconhecido. */
  metValue: number | null;
  /** "excêntrica-pausa-concêntrica-pausa", ex.: "2-0-1-0". */
  defaultTempo: string | null;
  translations: Record<SeedLocale, SeedExerciseTranslation>;
  /** Slugs de variantes mais fáceis (progressão easier -> este). */
  easier: string[];
  /** Slugs de variantes mais difíceis (progressão este -> harder). Opcional. */
  harder?: string[];
}

export interface SeedWorkoutExercise {
  slug: string;
  /** Para exercícios com metric REPS. Em unilaterais: repetições por lado. */
  targetReps?: number;
  /** Para exercícios com metric DURATION. Em unilaterais: segundos por lado. */
  targetDurationSec?: number;
  /** Descanso depois deste exercício; se omitido usa restBetweenExercisesSec do bloco. */
  restAfterSec?: number;
  notes?: string;
}

export interface SeedWorkoutBlock {
  type: BlockType;
  format: WorkoutFormat;
  name?: string;
  rounds: number;
  /** Limite de tempo do bloco (AMRAP/EMOM/TABATA), em segundos. */
  timeCapSec: number | null;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  notes?: string;
  exercises: SeedWorkoutExercise[];
}

export interface SeedWorkout {
  /** Nome determinístico — é a chave do upsert (juntamente com source SYSTEM). */
  name: string;
  description: string;
  focus: WorkoutFocus;
  difficulty: Difficulty;
  blocks: SeedWorkoutBlock[];
}

/** SeedWorkout com os campos derivados já calculados (duração, equipamento). */
export interface ResolvedSeedWorkout extends SeedWorkout {
  estimatedDurationMin: number;
  requiredEquipment: Equipment[];
}
