/**
 * Alvos por exercício (reps ou segundos) em função do nível, da diferença
 * entre a dificuldade do exercício e o alvo, e do estado do dia.
 */
import type { FitnessLevel } from '../../constants/enums';
import type { DifficultyRange } from './difficulty';
import { clamp, difficultyCenter } from './difficulty';
import type { Range } from './duration';
import type { EngineExercise, GeneratedExercise } from './types';

export interface TargetContext {
  level: FitnessLevel;
  target: DifficultyRange;
  /** Energia baixa ou modo ≠ NORMAL: alvos a 80%. */
  reduced: boolean;
}

const REPS_BY_LEVEL: Record<FitnessLevel, Range> = {
  BEGINNER: [8, 10],
  INTERMEDIATE: [10, 14],
  ADVANCED: [12, 16],
  ATHLETE: [15, 20],
};

/** Segundos base para exercícios por tempo (30–45 s). */
const DURATION_BY_LEVEL: Record<FitnessLevel, number> = {
  BEGINNER: 30,
  INTERMEDIATE: 35,
  ADVANCED: 40,
  ATHLETE: 45,
};

/** Isométricos (prancha, etc.): 20–45 s. */
const ISOMETRIC_BY_LEVEL: Record<FitnessLevel, number> = {
  BEGINNER: 20,
  INTERMEDIATE: 30,
  ADVANCED: 35,
  ATHLETE: 45,
};

const REDUCED_FACTOR = 0.8;
const UNILATERAL_NOTE = 'por lado';

const roundToFive = (value: number): number => Math.round(value / 5) * 5;

/** Reps: ponto médio do nível, −2 por cada nível de dificuldade acima do alvo (e vice-versa). */
export function computeTargetReps(exercise: EngineExercise, ctx: TargetContext): number {
  const [min, max] = REPS_BY_LEVEL[ctx.level];
  const delta = exercise.difficulty - difficultyCenter(ctx.target);
  const base = clamp(Math.round((min + max) / 2 - 2 * delta), min - 2, max + 2);
  const scaled = ctx.reduced ? base * REDUCED_FACTOR : base;
  return Math.max(4, Math.round(scaled));
}

/** Segundos: base por nível, −5 s por nível de dificuldade acima do alvo; múltiplos de 5. */
export function computeTargetDurationSec(exercise: EngineExercise, ctx: TargetContext): number {
  const isometric = exercise.movementPattern === 'ISOMETRIC';
  const base = isometric ? ISOMETRIC_BY_LEVEL[ctx.level] : DURATION_BY_LEVEL[ctx.level];
  const delta = exercise.difficulty - difficultyCenter(ctx.target);
  const adjusted = clamp(base - 5 * delta, isometric ? 20 : 30, 45);
  const scaled = ctx.reduced ? adjusted * REDUCED_FACTOR : adjusted;
  return Math.max(15, roundToFive(scaled));
}

/** Esqueleto de um exercício gerado (sem ordem nem descanso — o bloco trata disso). */
export function buildGeneratedExercise(exercise: EngineExercise, ctx: TargetContext): Omit<GeneratedExercise, 'order' | 'restAfterSec'> {
  // Sem cargas nem distâncias nesta fase (peso do corpo): DISTANCE/CALORIES tratam-se como esforço por tempo.
  const byReps = exercise.metric === 'REPS';
  return {
    exerciseId: exercise.id,
    targetReps: byReps ? computeTargetReps(exercise, ctx) : null,
    targetDurationSec: byReps ? null : computeTargetDurationSec(exercise, ctx),
    targetDistanceM: null,
    targetLoadKg: null,
    tempo: null,
    notes: exercise.isUnilateral ? UNILATERAL_NOTE : null,
  };
}

/** Exercício por tempo fixo (aquecimento, retorno à calma, tabata). */
export function buildTimedExercise(exercise: EngineExercise, durationSec: number): Omit<GeneratedExercise, 'order' | 'restAfterSec'> {
  return {
    exerciseId: exercise.id,
    targetReps: null,
    targetDurationSec: durationSec,
    targetDistanceM: null,
    targetLoadKg: null,
    tempo: null,
    notes: exercise.isUnilateral ? UNILATERAL_NOTE : null,
  };
}

/** Escala reps/segundos de um esqueleto (usado no finisher, alvos a 60%). */
export function scaleTargetsOf<T extends { targetReps: number | null; targetDurationSec: number | null }>(draft: T, factor: number): T {
  return {
    ...draft,
    targetReps: draft.targetReps == null ? null : Math.max(4, Math.round(draft.targetReps * factor)),
    targetDurationSec: draft.targetDurationSec == null ? null : Math.max(15, roundToFive(draft.targetDurationSec * factor)),
  };
}
