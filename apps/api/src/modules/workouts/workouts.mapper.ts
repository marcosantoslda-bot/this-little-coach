import type { Prisma } from '@tlc/database';
import type { Workout, WorkoutBlock, WorkoutSummary } from '@tlc/shared';
import { toIso, toNumber } from '../../common/mapping/primitives';
import { toExercise } from '../exercises/exercises.mapper';
import type { WorkoutFullRow, WorkoutSummaryRow } from './workouts.selectors';

/** Forma guardada em `Workout.generationInput` pelos treinos gerados. */
export interface StoredGenerationInput {
  params: unknown;
  explanation: string[];
}

export function toWorkout(row: WorkoutFullRow, locale: string): Workout {
  return {
    ...toWorkoutBase(row),
    explanation: readExplanation(row.generationInput),
    blocks: row.blocks.map((block) => toWorkoutBlock(block, locale)),
  };
}

export function toWorkoutSummary(row: WorkoutSummaryRow): WorkoutSummary {
  return {
    ...toWorkoutBase(row),
    exerciseCount: row.blocks.reduce((total, block) => total + block._count.exercises, 0),
  };
}

function toWorkoutBase(row: WorkoutFullRow | WorkoutSummaryRow): Omit<WorkoutSummary, 'exerciseCount'> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    focus: row.focus,
    difficulty: row.difficulty,
    estimatedDurationMin: row.estimatedDurationMin,
    requiredEquipment: row.requiredEquipment,
    source: row.source,
    createdById: row.createdById,
    createdAt: toIso(row.createdAt),
  };
}

function toWorkoutBlock(block: WorkoutFullRow['blocks'][number], locale: string): WorkoutBlock {
  return {
    id: block.id,
    order: block.order,
    type: block.type,
    format: block.format,
    name: block.name,
    rounds: block.rounds,
    timeCapSec: block.timeCapSec,
    restBetweenExercisesSec: block.restBetweenExercisesSec,
    restBetweenRoundsSec: block.restBetweenRoundsSec,
    notes: block.notes,
    exercises: block.exercises.map((item) => ({
      id: item.id,
      order: item.order,
      exercise: toExercise(item.exercise, locale),
      targetReps: item.targetReps,
      targetDurationSec: item.targetDurationSec,
      targetDistanceM: item.targetDistanceM,
      targetLoadKg: toNumber(item.targetLoadKg),
      restAfterSec: item.restAfterSec,
      tempo: item.tempo,
      notes: item.notes,
    })),
  };
}

/** A explicação do gerador vive em `generationInput.explanation`. */
export function readExplanation(generationInput: Prisma.JsonValue | null): string[] {
  if (!generationInput || typeof generationInput !== 'object' || Array.isArray(generationInput)) return [];
  const explanation = (generationInput as Record<string, unknown>).explanation;
  return Array.isArray(explanation) ? explanation.filter((line): line is string => typeof line === 'string') : [];
}
