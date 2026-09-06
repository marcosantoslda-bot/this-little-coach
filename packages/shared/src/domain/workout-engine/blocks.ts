/**
 * Blocos auxiliares: aquecimento, finisher e retorno à calma.
 * Cada função devolve um bloco pronto (ordem = 0; o orquestrador renumera).
 */
import type { FitnessGoal } from '../../constants/enums';
import { isCardio, isMobility, isStretch, type ExercisePredicate } from './focus';
import { selectByPreference, type SelectionContext } from './selection';
import { buildGeneratedExercise, buildTimedExercise, scaleTargetsOf, type TargetContext } from './targets';
import type { EngineExercise, GeneratedBlock, GeneratedExercise } from './types';

type ExerciseDraft = Omit<GeneratedExercise, 'order' | 'restAfterSec'>;

/** Numera os exercícios e aplica o descanso entre eles (o último não descansa: entra o descanso da volta). */
export function finalizeExercises(drafts: readonly ExerciseDraft[], restBetweenExercisesSec: number | null): GeneratedExercise[] {
  return drafts.map((draft, index) => ({
    ...draft,
    order: index,
    restAfterSec: restBetweenExercisesSec == null || index === drafts.length - 1 ? null : restBetweenExercisesSec,
  }));
}

const lowDifficulty: ExercisePredicate = (e) => e.difficulty <= 2 && !isStretch(e);
const lowDifficultyCardio: ExercisePredicate = (e) => isCardio(e) && e.difficulty <= 2;
const anything: ExercisePredicate = () => true;

// ── Aquecimento ─────────────────────────────────────────────────────────────

const WARMUP_EXERCISE_COUNT = 4;
const WARMUP_REST_SEC = 10;

/** Aquecimento: 3–4 exercícios de mobilidade/cardio leve, 30–40 s cada, 1 volta. */
export function buildWarmupBlock(ctx: SelectionContext, availableMinutes: number): GeneratedBlock | null {
  const exercises = selectByPreference(ctx, [isMobility, lowDifficultyCardio, lowDifficulty, anything], WARMUP_EXERCISE_COUNT);
  if (exercises.length === 0) return null;
  const durationSec = availableMinutes >= 30 ? 40 : 30;
  return {
    order: 0,
    type: 'WARMUP',
    format: 'CIRCUIT',
    name: 'Aquecimento',
    rounds: 1,
    timeCapSec: null,
    restBetweenExercisesSec: WARMUP_REST_SEC,
    restBetweenRoundsSec: 0,
    notes: 'Ritmo leve, amplitude controlada.',
    exercises: finalizeExercises(exercises.map((e) => buildTimedExercise(e, durationSec)), WARMUP_REST_SEC),
  };
}

// ── Retorno à calma ─────────────────────────────────────────────────────────

const COOLDOWN_DURATION_SEC = 30;

/** Retorno à calma: 2–3 min de alongamentos/mobilidade a 30 s, sem descanso. */
export function buildCooldownBlock(ctx: SelectionContext, availableMinutes: number): GeneratedBlock | null {
  const targetSec = availableMinutes >= 30 ? 180 : 120;
  const count = Math.round(targetSec / COOLDOWN_DURATION_SEC);
  const exercises = trimToBudget(selectByPreference(ctx, [isStretch, isMobility, lowDifficulty], count), targetSec);
  if (exercises.length === 0) return null;
  return {
    order: 0,
    type: 'COOLDOWN',
    format: 'CIRCUIT',
    name: 'Retorno à calma',
    rounds: 1,
    timeCapSec: null,
    restBetweenExercisesSec: 0,
    restBetweenRoundsSec: 0,
    notes: 'Respira fundo e alonga sem forçar.',
    exercises: finalizeExercises(exercises.map((e) => buildTimedExercise(e, COOLDOWN_DURATION_SEC)), null),
  };
}

/** Alongamentos unilaterais contam a dobrar; corta a lista para não passar o orçamento. */
function trimToBudget(exercises: readonly EngineExercise[], budgetSec: number): EngineExercise[] {
  const kept: EngineExercise[] = [];
  let total = 0;
  for (const exercise of exercises) {
    const cost = COOLDOWN_DURATION_SEC * (exercise.isUnilateral ? 2 : 1);
    if (kept.length > 0 && total + cost > budgetSec) break;
    kept.push(exercise);
    total += cost;
  }
  return kept;
}

// ── Finisher ────────────────────────────────────────────────────────────────

const TABATA_GOALS: ReadonlySet<FitnessGoal> = new Set(['LOSE_FAT', 'IMPROVE_ENDURANCE']);

/** Há finisher quando há tempo (≥ 30 min), energia (≥ 3) e o modo é normal. */
export function shouldAddFinisher(availableMinutes: number, energyLevel: number, isNormalMode: boolean): boolean {
  return availableMinutes >= 30 && energyLevel >= 3 && isNormalMode;
}

/** Segundos que o finisher vai ocupar — conhecido antes de escolher exercícios. */
export function finisherCapSec(goal: FitnessGoal, availableMinutes: number): number {
  if (TABATA_GOALS.has(goal)) return 240;
  return availableMinutes >= 45 ? 240 : 180;
}

/** Finisher: TABATA (perder gordura/resistência) ou AMRAP curto, 3–4 min. */
export function buildFinisherBlock(ctx: SelectionContext, targetCtx: TargetContext, goal: FitnessGoal, availableMinutes: number): GeneratedBlock | null {
  const capSec = finisherCapSec(goal, availableMinutes);
  const preferences: ExercisePredicate[] = [(e) => isCardio(e) && e.difficulty <= ctx.target.max, isCardio, (e) => e.difficulty <= ctx.target.max, anything];
  if (TABATA_GOALS.has(goal)) return buildTabata(ctx, preferences, capSec);
  return buildAmrapFinisher(ctx, targetCtx, preferences, capSec);
}

/** Tabata clássico: 20 s trabalho / 10 s descanso, 8 intervalos alternando 1–2 exercícios. */
function buildTabata(ctx: SelectionContext, preferences: readonly ExercisePredicate[], capSec: number): GeneratedBlock | null {
  const exercises = selectByPreference(ctx, preferences, 2);
  if (exercises.length === 0) return null;
  return {
    order: 0,
    type: 'FINISHER',
    format: 'TABATA',
    name: 'Finisher',
    rounds: 8 / exercises.length,
    timeCapSec: capSec,
    restBetweenExercisesSec: 10,
    restBetweenRoundsSec: 10,
    notes: '20 s a fundo, 10 s de descanso.',
    exercises: finalizeExercises(exercises.map((e) => buildTimedExercise(e, 20)), 10),
  };
}

/** AMRAP curto: 3 exercícios com alvos a 60%, tantas voltas quanto possível até ao tempo limite. */
function buildAmrapFinisher(ctx: SelectionContext, targetCtx: TargetContext, preferences: readonly ExercisePredicate[], capSec: number): GeneratedBlock | null {
  const exercises = selectByPreference(ctx, preferences, 3);
  if (exercises.length === 0) return null;
  return {
    order: 0,
    type: 'FINISHER',
    format: 'AMRAP',
    name: 'Finisher',
    rounds: 1,
    timeCapSec: capSec,
    restBetweenExercisesSec: 0,
    restBetweenRoundsSec: 0,
    notes: 'O máximo de voltas até ao tempo limite.',
    exercises: finalizeExercises(exercises.map((e) => scaleTargetsOf(buildGeneratedExercise(e, targetCtx), 0.6)), null),
  };
}
