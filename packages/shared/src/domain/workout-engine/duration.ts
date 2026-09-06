/**
 * Estimativa de duração e "encaixe" de um bloco no tempo disponível.
 *
 * Convenções:
 * - REPS: cerca de 3 s por repetição; exercícios unilaterais contam a dobrar
 *   (uma vez por lado).
 * - DURATION: o tempo indicado (unilateral também a dobrar).
 * - AMRAP/TABATA: vale o `timeCapSec`.
 * - Restantes formatos: rounds × (trabalho + descansos entre exercícios)
 *   + (rounds − 1) × descanso entre voltas.
 */
import type { WorkoutFormat } from '../../constants/enums';
import type { EngineExercise, GeneratedBlock, GeneratedExercise } from './types';
import { clamp } from './difficulty';

export const SECONDS_PER_REP = 3;

/** Formatos cujo tempo é fixado pelo `timeCapSec` e não pelas séries. */
const TIME_CAPPED_FORMATS: ReadonlySet<WorkoutFormat> = new Set(['AMRAP', 'TABATA', 'EMOM']);

export type ExerciseIndex = ReadonlyMap<string, EngineExercise>;

export function indexById(catalog: readonly EngineExercise[]): Map<string, EngineExercise> {
  return new Map(catalog.map((e) => [e.id, e]));
}

/** Segundos de esforço de um exercício numa volta (sem descanso). */
export function estimateExerciseWorkSec(exercise: GeneratedExercise, meta: EngineExercise | undefined): number {
  const sides = meta?.isUnilateral ? 2 : 1;
  if (exercise.targetDurationSec != null) return exercise.targetDurationSec * sides;
  if (exercise.targetReps != null) return exercise.targetReps * SECONDS_PER_REP * sides;
  return 0;
}

/** Segundos de uma volta completa: trabalho + descansos entre exercícios. */
function estimateRoundSec(block: GeneratedBlock, byId: ExerciseIndex): number {
  return block.exercises.reduce((total, exercise, index) => {
    const isLast = index === block.exercises.length - 1;
    const rest = isLast ? 0 : (exercise.restAfterSec ?? block.restBetweenExercisesSec);
    return total + estimateExerciseWorkSec(exercise, byId.get(exercise.exerciseId)) + rest;
  }, 0);
}

/** Duração estimada de um bloco, em segundos. */
export function estimateBlockDurationSec(block: GeneratedBlock, byId: ExerciseIndex): number {
  if (TIME_CAPPED_FORMATS.has(block.format) && block.timeCapSec != null) return block.timeCapSec;
  if (block.exercises.length === 0) return 0;
  const rounds = Math.max(1, block.rounds);
  return rounds * estimateRoundSec(block, byId) + (rounds - 1) * block.restBetweenRoundsSec;
}

/** Duração estimada de um conjunto de blocos, em segundos. */
export function estimateBlocksDurationSec(blocks: readonly GeneratedBlock[], byId: ExerciseIndex): number {
  return blocks.reduce((total, block) => total + estimateBlockDurationSec(block, byId), 0);
}

/** Duração estimada do treino em minutos (arredondada, nunca abaixo de 1). */
export function summarizeWorkoutDuration(blocks: readonly GeneratedBlock[], catalog: readonly EngineExercise[]): number {
  const seconds = estimateBlocksDurationSec(blocks, indexById(catalog));
  return Math.max(1, Math.round(seconds / 60));
}

// ── Encaixe no tempo disponível ─────────────────────────────────────────────

/** Intervalo inclusivo [min, max]. */
export type Range = readonly [number, number];

/** Parâmetros de um formato: número de voltas e descansos admissíveis. */
export interface FormatPlan {
  format: WorkoutFormat;
  rounds: Range;
  restBetweenExercisesSec: Range;
  restBetweenRoundsSec: Range;
}

export interface FitOptions {
  /** Permite aumentar reps/duração para preencher o tempo (desligado com pouca energia). */
  allowScaleUp: boolean;
  /** Tolerância relativa aceitável (0.1 = ±10%). */
  tolerance: number;
}

interface FitCandidate {
  rounds: number;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  totalSec: number;
  score: number;
}

/**
 * Procura (voltas, descanso entre exercícios, descanso entre voltas) que
 * aproxime melhor o bloco de `budgetSec`. Voltas fora do intervalo preferido
 * são permitidas mas penalizadas — só ganham quando nada mais encaixa.
 */
function searchRoundsAndRests(workPerRoundSec: number, exerciseCount: number, budgetSec: number, plan: FormatPlan): FitCandidate {
  const [minRounds, maxRounds] = plan.rounds;
  const [minRestEx, maxRestEx] = plan.restBetweenExercisesSec;
  const [minRestRound, maxRestRound] = plan.restBetweenRoundsSec;
  const penaltySec = budgetSec * 0.15;
  let best: FitCandidate | null = null;

  for (let rounds = 1; rounds <= maxRounds; rounds++) {
    for (let restEx = minRestEx; restEx <= maxRestEx; restEx += 5) {
      const workAndRestEx = rounds * (workPerRoundSec + (exerciseCount - 1) * restEx);
      // Descanso entre voltas que fecharia a conta, limitado ao intervalo do formato.
      const idealRestRound = rounds > 1 ? (budgetSec - workAndRestEx) / (rounds - 1) : minRestRound;
      const restRound = Math.round(clamp(idealRestRound, minRestRound, maxRestRound) / 5) * 5;
      const totalSec = workAndRestEx + (rounds - 1) * restRound;
      const score = Math.abs(totalSec - budgetSec) + (rounds < minRounds ? penaltySec : 0);
      if (best == null || score < best.score) {
        best = { rounds, restBetweenExercisesSec: restEx, restBetweenRoundsSec: restRound, totalSec, score };
      }
    }
  }
  return best as FitCandidate;
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

/** Aplica um fator aos alvos (reps/duração) de um exercício, com limites sensatos. */
export function scaleExerciseTargets(exercise: GeneratedExercise, factor: number): GeneratedExercise {
  return {
    ...exercise,
    targetReps: exercise.targetReps == null ? null : clamp(Math.round(exercise.targetReps * factor), 4, 30),
    targetDurationSec: exercise.targetDurationSec == null ? null : clamp(roundToFive(exercise.targetDurationSec * factor), 15, 60),
  };
}

function applyCandidate(block: GeneratedBlock, candidate: FitCandidate): GeneratedBlock {
  const exercises = block.exercises.map((exercise, index) => ({
    ...exercise,
    restAfterSec: index === block.exercises.length - 1 ? null : candidate.restBetweenExercisesSec,
  }));
  return {
    ...block,
    rounds: candidate.rounds,
    restBetweenExercisesSec: candidate.restBetweenExercisesSec,
    restBetweenRoundsSec: candidate.restBetweenRoundsSec,
    exercises,
  };
}

function workPerRound(block: GeneratedBlock, byId: ExerciseIndex): number {
  return block.exercises.reduce((total, e) => total + estimateExerciseWorkSec(e, byId.get(e.exerciseId)), 0);
}

/**
 * Encaixa um bloco de séries/circuito em `budgetSec`: primeiro ajusta voltas e
 * descansos; se ainda ficar longe (> tolerância), escala os alvos e repete.
 */
export function fitBlockToBudget(block: GeneratedBlock, byId: ExerciseIndex, budgetSec: number, plan: FormatPlan, options: FitOptions): GeneratedBlock {
  if (block.exercises.length === 0) return block;

  let fitted = applyCandidate(block, searchRoundsAndRests(workPerRound(block, byId), block.exercises.length, budgetSec, plan));
  const gap = budgetSec - estimateBlockDurationSec(fitted, byId);
  if (Math.abs(gap) <= budgetSec * options.tolerance) return fitted;
  if (gap > 0 && !options.allowScaleUp) return fitted;

  // Escala o trabalho para cobrir a diferença e volta a procurar o melhor encaixe.
  const work = workPerRound(fitted, byId) * fitted.rounds;
  const factor = clamp((work + gap) / work, 0.6, 1.6);
  const scaled: GeneratedBlock = { ...fitted, exercises: fitted.exercises.map((e) => scaleExerciseTargets(e, factor)) };
  fitted = applyCandidate(scaled, searchRoundsAndRests(workPerRound(scaled, byId), scaled.exercises.length, budgetSec, plan));
  return fitted;
}
