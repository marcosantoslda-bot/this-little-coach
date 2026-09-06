import type { Equipment } from '@tlc/shared';

/** Segundos estimados por repetição (tempo 2-0-1-0). */
export const SECONDS_PER_REP = 3;
const DEFAULT_EXERCISE_SECONDS = 45;

export interface BlockForEstimate {
  rounds: number;
  timeCapSec: number | null;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  exercises: { targetReps: number | null; targetDurationSec: number | null; restAfterSec: number | null }[];
}

export function estimateBlockSeconds(block: BlockForEstimate): number {
  if (block.timeCapSec) return block.timeCapSec;
  const perRound = block.exercises.reduce((total, exercise) => {
    const work = exercise.targetDurationSec ?? (exercise.targetReps ? exercise.targetReps * SECONDS_PER_REP : DEFAULT_EXERCISE_SECONDS);
    return total + work + (exercise.restAfterSec ?? block.restBetweenExercisesSec);
  }, 0);
  return perRound * block.rounds + Math.max(0, block.rounds - 1) * block.restBetweenRoundsSec;
}

export function estimateWorkoutMinutes(blocks: BlockForEstimate[]): number {
  const seconds = blocks.reduce((total, block) => total + estimateBlockSeconds(block), 0);
  return Math.max(1, Math.round(seconds / 60));
}

/** Dificuldade 1–5 = média arredondada das dificuldades dos exercícios. */
export function aggregateDifficulty(difficulties: number[]): number {
  if (difficulties.length === 0) return 1;
  const mean = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
  return Math.min(5, Math.max(1, Math.round(mean)));
}

/** União do equipamento dos exercícios; NONE só fica se nada mais for preciso. */
export function aggregateEquipment(lists: readonly (readonly Equipment[])[]): Equipment[] {
  const union = new Set<Equipment>(lists.flat());
  if (union.size > 1) union.delete('NONE');
  return union.size === 0 ? ['NONE'] : [...union];
}
