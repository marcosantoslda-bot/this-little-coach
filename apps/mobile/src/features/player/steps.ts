import type { BlockType, WorkoutBlock, WorkoutExercise, WorkoutFormat } from '@tlc/shared';

export interface ExerciseStep {
  kind: 'exercise';
  key: string;
  blockIndex: number;
  blockOrder: number;
  blockType: BlockType;
  blockName: string | null;
  format: WorkoutFormat;
  round: number;
  rounds: number;
  we: WorkoutExercise;
  /** Posição do exercício dentro do bloco (0-based). */
  exerciseIndex: number;
  exerciseCount: number;
}

export interface RestStep {
  kind: 'rest';
  key: string;
  blockType: BlockType;
  seconds: number;
  /** Nome do próximo exercício, para "A seguir". */
  nextName: string | null;
}

export type Step = ExerciseStep | RestStep;

/** Formatos em que cada exercício faz todas as séries seguidas (A A A, B B B). */
function isStraight(format: WorkoutFormat): boolean {
  return format === 'STRAIGHT_SETS';
}

/**
 * Achata os blocos numa lista linear de passos (exercício / descanso).
 * Séries: rounds do bloco. Descanso entre séries: restAfterSec do exercício,
 * senão o do bloco. Sem descanso a zero.
 */
export function buildSteps(blocks: WorkoutBlock[]): Step[] {
  const steps: Step[] = [];
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const rest = (blockType: BlockType, seconds: number, nextName: string | null) => {
    if (seconds > 0) steps.push({ kind: 'rest', key: `rest-${steps.length}`, blockType, seconds, nextName });
  };

  sortedBlocks.forEach((block, blockIndex) => {
    const exercises = [...block.exercises].sort((a, b) => a.order - b.order);
    const rounds = Math.max(1, block.rounds);
    const base = {
      blockIndex,
      blockOrder: block.order,
      blockType: block.type,
      blockName: block.name,
      format: block.format,
      rounds,
      exerciseCount: exercises.length,
    };

    if (isStraight(block.format)) {
      exercises.forEach((we, exerciseIndex) => {
        for (let round = 1; round <= rounds; round++) {
          steps.push({ kind: 'exercise', key: `${we.id}-${round}`, ...base, round, we, exerciseIndex });
          const isLastSet = round === rounds;
          const isLastExercise = exerciseIndex === exercises.length - 1;
          if (!(isLastSet && isLastExercise)) {
            const seconds = isLastSet ? block.restBetweenExercisesSec : (we.restAfterSec ?? block.restBetweenRoundsSec);
            const next = isLastSet ? (exercises[exerciseIndex + 1]?.exercise.name ?? null) : we.exercise.name;
            rest(block.type, seconds, next);
          }
        }
      });
      return;
    }

    for (let round = 1; round <= rounds; round++) {
      exercises.forEach((we, exerciseIndex) => {
        steps.push({ kind: 'exercise', key: `${we.id}-${round}`, ...base, round, we, exerciseIndex });
        const isLastExercise = exerciseIndex === exercises.length - 1;
        if (!isLastExercise) {
          rest(block.type, we.restAfterSec ?? block.restBetweenExercisesSec, exercises[exerciseIndex + 1]?.exercise.name ?? null);
        } else if (round < rounds) {
          rest(block.type, block.restBetweenRoundsSec, exercises[0]?.exercise.name ?? null);
        }
      });
    }
  });

  return steps;
}

/** Índice do passo de exercício (para `SessionSet.order`). */
export function exerciseOrder(steps: Step[], index: number): number {
  let n = 0;
  for (let i = 0; i < index; i++) if (steps[i]?.kind === 'exercise') n++;
  return n;
}

export function countExerciseSteps(steps: Step[]): number {
  return steps.filter((s) => s.kind === 'exercise').length;
}
