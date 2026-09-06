import type {
  BlockType, Equipment, ExerciseCategory, ExerciseMetric, FitnessGoal, FitnessLevel,
  MovementPattern, MuscleGroup, TrainingFocus, TrainingMode, WorkoutFocus, WorkoutFormat,
} from '../../constants/enums';

/** Exercício tal como o motor o vê — independente de Prisma ou da API. */
export interface EngineExercise {
  id: string;
  slug: string;
  name: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  /** 1–5 */
  difficulty: number;
  metric: ExerciseMetric;
  isUnilateral: boolean;
  metValue: number | null;
  easierIds: string[];
  harderIds: string[];
}

export interface EngineProfile {
  fitnessLevel: FitnessLevel;
  goal: FitnessGoal;
  focus: TrainingFocus;
  restrictedMuscles: MuscleGroup[];
  activeMode: TrainingMode;
  bodyWeightKg: number | null;
}

export interface GenerateWorkoutParams {
  profile: EngineProfile;
  availableMinutes: number;
  /** 1–5 */
  energyLevel: number;
  equipment: Equipment[];
  focus?: WorkoutFocus;
  seed: number;
}

export interface GeneratedExercise {
  exerciseId: string;
  order: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistanceM: number | null;
  targetLoadKg: number | null;
  restAfterSec: number | null;
  tempo: string | null;
  notes: string | null;
}

export interface GeneratedBlock {
  order: number;
  type: BlockType;
  format: WorkoutFormat;
  name: string | null;
  rounds: number;
  timeCapSec: number | null;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  notes: string | null;
  exercises: GeneratedExercise[];
}

export interface GeneratedWorkout {
  name: string;
  description: string | null;
  focus: WorkoutFocus;
  difficulty: number;
  estimatedDurationMin: number;
  requiredEquipment: Equipment[];
  blocks: GeneratedBlock[];
  /** Frases em pt-PT que explicam as escolhas ("treino explicável"). */
  explanation: string[];
  generatorVersion: string;
  /** Eco dos inputs, para guardar em Workout.generationInput. */
  generationInput: GenerateWorkoutParams;
}
