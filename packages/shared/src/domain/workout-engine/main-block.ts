/**
 * Bloco principal: formato (pelo objetivo/tempo), vagas por padrão de movimento,
 * alvos e encaixe no tempo que sobra depois do aquecimento, finisher e retorno à calma.
 */
import type { FitnessGoal, WorkoutFocus } from '../../constants/enums';
import { WORKOUT_FORMAT_LABELS } from '../../constants/labels.pt';
import { clamp } from './difficulty';
import { fitBlockToBudget, type ExerciseIndex, type FitOptions, type FormatPlan } from './duration';
import { buildPatternSlots, isMainCandidate } from './focus';
import { selectForSlots, type ExerciseSwap, type SelectionContext } from './selection';
import { buildGeneratedExercise, type TargetContext } from './targets';
import type { EngineExercise, GeneratedBlock } from './types';
import { finalizeExercises } from './blocks';

const CARDIO_GOALS: ReadonlySet<FitnessGoal> = new Set(['LOSE_FAT', 'IMPROVE_ENDURANCE']);
/** Abaixo disto, objetivos de cardio passam a AMRAP (um único bloco por tempo). */
const AMRAP_THRESHOLD_MIN = 20;

const CIRCUIT_PLAN: FormatPlan = { format: 'CIRCUIT', rounds: [3, 5], restBetweenExercisesSec: [15, 30], restBetweenRoundsSec: [45, 90] };
const LIGHT_CIRCUIT_PLAN: FormatPlan = { ...CIRCUIT_PLAN, rounds: [3, 4] };
const STRAIGHT_SETS_PLAN: FormatPlan = { format: 'STRAIGHT_SETS', rounds: [3, 4], restBetweenExercisesSec: [45, 75], restBetweenRoundsSec: [60, 90] };
const AMRAP_PLAN: FormatPlan = { format: 'AMRAP', rounds: [1, 1], restBetweenExercisesSec: [0, 0], restBetweenRoundsSec: [0, 0] };

/** Escolhe o formato pelo objetivo e pelo tempo; modos reduzidos limitam as voltas a 3. */
export function chooseMainPlan(goal: FitnessGoal, availableMinutes: number, reduced: boolean): FormatPlan {
  let plan: FormatPlan;
  if (CARDIO_GOALS.has(goal)) plan = availableMinutes < AMRAP_THRESHOLD_MIN ? AMRAP_PLAN : CIRCUIT_PLAN;
  else if (goal === 'GAIN_MUSCLE') plan = STRAIGHT_SETS_PLAN;
  else plan = LIGHT_CIRCUIT_PLAN;
  if (!reduced || plan.format === 'AMRAP') return plan;
  return { ...plan, rounds: [Math.min(plan.rounds[0], 3), Math.min(plan.rounds[1], 3)] };
}

/** 4–7 exercícios, ~1 por cada 3,5 min de bloco principal; 5 no máximo em modo reduzido. */
export function chooseMainExerciseCount(mainBudgetSec: number, reduced: boolean): number {
  return clamp(Math.round(mainBudgetSec / 60 / 3.5), 4, reduced ? 5 : 7);
}

export interface MainBlockInput {
  ctx: SelectionContext;
  targetCtx: TargetContext;
  byId: ExerciseIndex;
  focus: WorkoutFocus;
  goal: FitnessGoal;
  energyLevel: number;
  plan: FormatPlan;
  exerciseCount: number;
}

export interface MainBlockDraft {
  block: GeneratedBlock;
  exercises: EngineExercise[];
  swaps: ExerciseSwap[];
}

/** Escolhe os exercícios do bloco principal e monta o bloco ainda sem encaixe no tempo. */
export function draftMainBlock(input: MainBlockInput): MainBlockDraft {
  const { ctx, targetCtx, focus, goal, energyLevel, plan, exerciseCount } = input;
  const mainPool = focus === 'MOBILITY' ? ctx.pool : ctx.pool.filter(isMainCandidate);
  const pool = mainPool.length > 0 ? mainPool : ctx.pool;
  const slots = buildPatternSlots(focus, goal, energyLevel, exerciseCount);
  const { exercises, swaps } = selectForSlots(ctx, slots, pool);

  const isAmrap = plan.format === 'AMRAP';
  const block: GeneratedBlock = {
    order: 0,
    type: 'MAIN',
    format: plan.format,
    name: WORKOUT_FORMAT_LABELS[plan.format],
    rounds: plan.rounds[0],
    timeCapSec: null,
    restBetweenExercisesSec: plan.restBetweenExercisesSec[0],
    restBetweenRoundsSec: plan.restBetweenRoundsSec[0],
    notes: isAmrap ? 'O máximo de voltas até ao tempo limite, com técnica limpa.' : null,
    exercises: finalizeExercises(exercises.map((e) => buildGeneratedExercise(e, targetCtx)), isAmrap ? null : plan.restBetweenExercisesSec[0]),
  };
  return { block, exercises, swaps };
}

/** Encaixa o bloco principal no orçamento: AMRAP fecha pelo tempo limite; os outros por voltas/descansos/alvos. */
export function fitMainBlock(block: GeneratedBlock, byId: ExerciseIndex, budgetSec: number, plan: FormatPlan, options: FitOptions): GeneratedBlock {
  if (plan.format === 'AMRAP') {
    return { ...block, rounds: 1, timeCapSec: Math.max(60, Math.round(budgetSec / 30) * 30) };
  }
  return fitBlockToBudget(block, byId, budgetSec, plan, options);
}
