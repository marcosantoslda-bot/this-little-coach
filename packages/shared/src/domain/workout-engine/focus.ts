/**
 * Foco do treino: mapeamento do foco do perfil para o foco do treino e a
 * "receita" de padrões de movimento que cada foco deve equilibrar.
 */
import type { FitnessGoal, TrainingFocus, WorkoutFocus } from '../../constants/enums';
import type { EngineExercise } from './types';

/** Converte o foco de longo prazo do perfil no foco de um treino concreto. */
export function mapTrainingFocusToWorkoutFocus(focus: TrainingFocus): WorkoutFocus {
  switch (focus) {
    case 'LOWER_BODY_GLUTES':
      return 'LOWER_BODY';
    case 'UPPER_BODY_ARMS':
      return 'UPPER_BODY';
    case 'CORE':
      return 'CORE';
    case 'CARDIO':
      return 'CARDIO';
    case 'BALANCED':
    default:
      return 'FULL_BODY';
  }
}

/** Nome curto (pt-PT) usado no título do treino, ex.: "Pernas e glúteos · 40 min". */
export const WORKOUT_NAME_BY_FOCUS: Record<WorkoutFocus, string> = {
  FULL_BODY: 'Corpo inteiro',
  UPPER_BODY: 'Tronco e braços',
  LOWER_BODY: 'Pernas e glúteos',
  PUSH: 'Empurrar',
  PULL: 'Puxar',
  LEGS: 'Pernas',
  CORE: 'Core',
  CARDIO: 'Cardio',
  MOBILITY: 'Mobilidade',
};

export type ExercisePredicate = (exercise: EngineExercise) => boolean;

/** Uma "vaga" do bloco principal: o padrão que queremos e o plano B se não existir. */
export interface PatternSlot {
  /** Etiqueta curta (pt-PT) para a explicação. */
  label: string;
  matches: ExercisePredicate;
  fallback?: ExercisePredicate;
}

// ── Predicados reutilizáveis ────────────────────────────────────────────────

export const isSquatOrLunge: ExercisePredicate = (e) => e.movementPattern === 'SQUAT' || e.movementPattern === 'LUNGE';
export const isHinge: ExercisePredicate = (e) => e.movementPattern === 'HINGE';
export const isPush: ExercisePredicate = (e) => e.movementPattern === 'PUSH_HORIZONTAL' || e.movementPattern === 'PUSH_VERTICAL';
export const isPushHorizontal: ExercisePredicate = (e) => e.movementPattern === 'PUSH_HORIZONTAL';
export const isPushVertical: ExercisePredicate = (e) => e.movementPattern === 'PUSH_VERTICAL';
export const isPull: ExercisePredicate = (e) => e.movementPattern === 'PULL_HORIZONTAL' || e.movementPattern === 'PULL_VERTICAL';
export const isCore: ExercisePredicate = (e) =>
  e.category === 'CORE' || e.movementPattern === 'ROTATION' || e.movementPattern === 'ANTI_ROTATION' || e.movementPattern === 'ISOMETRIC';
export const isCardio: ExercisePredicate = (e) =>
  e.movementPattern === 'LOCOMOTION' || e.movementPattern === 'JUMP' || e.category === 'CARDIO' || e.category === 'PLYOMETRIC';
export const isGlutePrimary: ExercisePredicate = (e) => e.primaryMuscles.includes('GLUTES');
export const isMobility: ExercisePredicate = (e) => e.category === 'MOBILITY';
export const isStretch: ExercisePredicate = (e) => e.category === 'STRETCH';
/** Exercícios que fazem sentido no bloco principal (tudo menos mobilidade/alongamento). */
export const isMainCandidate: ExercisePredicate = (e) => !isMobility(e) && !isStretch(e);
export const isPushOrCore: ExercisePredicate = (e) => isPush(e) || isCore(e);

const slot = (label: string, matches: ExercisePredicate, fallback?: ExercisePredicate): PatternSlot =>
  fallback ? { label, matches, fallback } : { label, matches };

const SQUAT_SLOT = slot('agachar', isSquatOrLunge);
const HINGE_SLOT = slot('dobradiça de anca', isHinge);
const PUSH_SLOT = slot('empurrar', isPush);
/** Puxar sem barra é raro em casa: se não houver, cai para empurrar/core. */
const PULL_SLOT = slot('puxar', isPull, isPushOrCore);
const CORE_SLOT = slot('core', isCore);
const CARDIO_SLOT = slot('cardio', isCardio, isSquatOrLunge);
const GLUTE_SLOT = slot('glúteos', isGlutePrimary, isHinge);

interface FocusRecipe {
  /** Vagas obrigatórias, pela ordem em que aparecem no treino. */
  base: PatternSlot[];
  /** Vagas extra, repetidas em ciclo até chegar ao número pedido. */
  filler: PatternSlot[];
}

const RECIPES: Record<WorkoutFocus, FocusRecipe> = {
  FULL_BODY: { base: [SQUAT_SLOT, PUSH_SLOT, HINGE_SLOT, PULL_SLOT, CORE_SLOT], filler: [SQUAT_SLOT, PUSH_SLOT, HINGE_SLOT, CORE_SLOT, PULL_SLOT] },
  LOWER_BODY: { base: [SQUAT_SLOT, HINGE_SLOT, SQUAT_SLOT, HINGE_SLOT, GLUTE_SLOT, CORE_SLOT], filler: [SQUAT_SLOT, CARDIO_SLOT, HINGE_SLOT] },
  LEGS: { base: [SQUAT_SLOT, HINGE_SLOT, SQUAT_SLOT, HINGE_SLOT, GLUTE_SLOT, CORE_SLOT], filler: [SQUAT_SLOT, CARDIO_SLOT, HINGE_SLOT] },
  UPPER_BODY: {
    base: [slot('empurrar (horizontal)', isPushHorizontal, isPush), PULL_SLOT, slot('empurrar (vertical)', isPushVertical, isPush), PULL_SLOT, CORE_SLOT],
    filler: [PUSH_SLOT, PULL_SLOT, CORE_SLOT],
  },
  PUSH: { base: [slot('empurrar (horizontal)', isPushHorizontal, isPush), slot('empurrar (vertical)', isPushVertical, isPush), PUSH_SLOT, CORE_SLOT], filler: [PUSH_SLOT, CORE_SLOT] },
  PULL: { base: [PULL_SLOT, PULL_SLOT, PULL_SLOT, CORE_SLOT], filler: [PULL_SLOT, CORE_SLOT] },
  CORE: { base: [CORE_SLOT, CORE_SLOT, CORE_SLOT, CORE_SLOT], filler: [CORE_SLOT] },
  CARDIO: { base: [CARDIO_SLOT, SQUAT_SLOT, CARDIO_SLOT, CORE_SLOT, CARDIO_SLOT, HINGE_SLOT], filler: [CARDIO_SLOT, CORE_SLOT] },
  MOBILITY: { base: [slot('mobilidade', isMobility, isStretch), slot('mobilidade', isMobility, isStretch), CORE_SLOT], filler: [slot('mobilidade', isMobility, isStretch)] },
};

/** Objetivos em que acrescentamos um padrão de locomoção/salto quando há energia. */
const CARDIO_FRIENDLY_GOALS: ReadonlySet<FitnessGoal> = new Set(['LOSE_FAT', 'IMPROVE_ENDURANCE']);

/**
 * Constrói a lista de vagas do bloco principal para um foco, com `count`
 * posições. Em corpo inteiro, junta cardio quando o objetivo e a energia o pedem.
 */
export function buildPatternSlots(focus: WorkoutFocus, goal: FitnessGoal, energyLevel: number, count: number): PatternSlot[] {
  const recipe = RECIPES[focus];
  const base = [...recipe.base];
  if (focus === 'FULL_BODY' && energyLevel >= 3 && CARDIO_FRIENDLY_GOALS.has(goal)) {
    base.push(CARDIO_SLOT);
  }
  const slots = base.slice(0, count);
  for (let i = 0; slots.length < count && recipe.filler.length > 0; i++) {
    slots.push(recipe.filler[i % recipe.filler.length] as PatternSlot);
  }
  return slots;
}
