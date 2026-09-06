/**
 * Gerador de treinos (Fase 1): peso do corpo, adaptativo ao dia.
 *
 * Função pura e determinística: a mesma `seed` com os mesmos inputs produz o
 * mesmo treino. Toda a aleatoriedade vem de `createRng(seed)`.
 *
 * Estrutura: AQUECIMENTO → PRINCIPAL → [FINISHER] → RETORNO À CALMA.
 * O bloco principal é escolhido primeiro (tem prioridade nos exercícios) e
 * encaixado no tempo que sobra depois dos blocos auxiliares.
 */
import { EQUIPMENT, type Equipment } from '../../constants/enums';
import { FITNESS_GOAL_LABELS, WORKOUT_FORMAT_LABELS } from '../../constants/labels.pt';
import { buildCooldownBlock, buildFinisherBlock, buildWarmupBlock, finisherCapSec, shouldAddFinisher } from './blocks';
import { allowsHarderVariant, clamp, computeTargetDifficulty, isLowEnergy, isReducedMode } from './difficulty';
import { estimateBlocksDurationSec, indexById, summarizeWorkoutDuration } from './duration';
import { buildExplanation } from './explanation';
import { WORKOUT_NAME_BY_FOCUS, mapTrainingFocusToWorkoutFocus } from './focus';
import { chooseMainExerciseCount, chooseMainPlan, draftMainBlock, fitMainBlock } from './main-block';
import { createRng } from './random';
import { filterCatalog, type SelectionContext } from './selection';
import type { TargetContext } from './targets';
import type { EngineExercise, GenerateWorkoutParams, GeneratedBlock, GeneratedWorkout } from './types';

export const GENERATOR_VERSION = '1.0.0';

export const EMPTY_CATALOG_MESSAGE = 'Não há exercícios compatíveis com o equipamento e restrições indicados.';

/** Duração nominal dos blocos auxiliares, usada só para dimensionar o bloco principal. */
const NOMINAL_WARMUP_SEC = 190;
const NOMINAL_COOLDOWN_SEC = 150;
/** Nunca deixamos o bloco principal abaixo disto, mesmo em treinos muito curtos. */
const MIN_MAIN_BUDGET_SEC = 240;
const FIT_TOLERANCE = 0.08;

/** Férias e modos reduzidos encurtam o treino; o resto usa o tempo pedido. */
function effectiveBudgetSec(availableMinutes: number, mode: GenerateWorkoutParams['profile']['activeMode']): number {
  if (mode === 'VACATION') return Math.max(600, availableMinutes * 60 * 0.8);
  if (isReducedMode(mode)) return Math.max(600, availableMinutes * 60 * 0.75);
  return availableMinutes * 60;
}

/** União do equipamento realmente usado, pela ordem do enum; só peso do corpo → ['NONE']. */
function collectRequiredEquipment(blocks: readonly GeneratedBlock[], byId: ReadonlyMap<string, EngineExercise>): Equipment[] {
  const used = new Set<Equipment>();
  for (const block of blocks) {
    for (const exercise of block.exercises) {
      for (const item of byId.get(exercise.exerciseId)?.equipment ?? []) {
        if (item !== 'NONE') used.add(item);
      }
    }
  }
  const ordered = EQUIPMENT.filter((item) => used.has(item));
  return ordered.length > 0 ? ordered : ['NONE'];
}

/** Média arredondada da dificuldade dos exercícios principais (1–5). */
function averageDifficulty(exercises: readonly EngineExercise[]): number {
  if (exercises.length === 0) return 1;
  const mean = exercises.reduce((sum, e) => sum + e.difficulty, 0) / exercises.length;
  return clamp(Math.round(mean), 1, 5);
}

/** Renumera os blocos (0-based, contíguo) ignorando os que não existem. */
function orderBlocks(blocks: readonly (GeneratedBlock | null)[]): GeneratedBlock[] {
  return blocks.filter((b): b is GeneratedBlock => b != null).map((block, order) => ({ ...block, order }));
}

/** Cópia profunda dos inputs para guardar em Workout.generationInput sem partilhar referências. */
function echoParams(params: GenerateWorkoutParams): GenerateWorkoutParams {
  return {
    ...params,
    profile: { ...params.profile, restrictedMuscles: [...params.profile.restrictedMuscles] },
    equipment: [...params.equipment],
  };
}

/**
 * Gera um treino a partir do perfil, do tempo disponível, da energia do dia e
 * do equipamento à mão. Lança erro (pt-PT) se nenhum exercício for compatível.
 */
export function generateWorkout(params: GenerateWorkoutParams, catalog: EngineExercise[]): GeneratedWorkout {
  const { profile, energyLevel, availableMinutes } = params;
  const equipment = params.equipment.length > 0 ? params.equipment : (['NONE'] as Equipment[]);
  const pool = filterCatalog(catalog, equipment, profile.restrictedMuscles);
  if (pool.length === 0) throw new Error(EMPTY_CATALOG_MESSAGE);

  const mode = profile.activeMode;
  const reduced = isReducedMode(mode);
  const target = computeTargetDifficulty(profile.fitnessLevel, energyLevel, mode);
  const focus = params.focus ?? mapTrainingFocusToWorkoutFocus(profile.focus);
  const byId = indexById(pool);
  const ctx: SelectionContext = {
    rng: createRng(params.seed),
    pool,
    poolById: byId,
    used: new Set<string>(),
    target,
    allowHarder: allowsHarderVariant(energyLevel, mode),
  };
  const targetCtx: TargetContext = { level: profile.fitnessLevel, target, reduced: reduced || isLowEnergy(energyLevel) || mode !== 'NORMAL' };

  // 1. Dimensionar o bloco principal com durações nominais dos blocos auxiliares.
  const budgetSec = effectiveBudgetSec(availableMinutes, mode);
  const hasFinisher = shouldAddFinisher(availableMinutes, energyLevel, mode === 'NORMAL');
  const finisherSec = hasFinisher ? finisherCapSec(profile.goal, availableMinutes) : 0;
  const nominalMainBudget = Math.max(MIN_MAIN_BUDGET_SEC, budgetSec - NOMINAL_WARMUP_SEC - NOMINAL_COOLDOWN_SEC - finisherSec);
  const plan = chooseMainPlan(profile.goal, availableMinutes, reduced);
  const exerciseCount = chooseMainExerciseCount(nominalMainBudget, reduced);

  // 2. Escolher exercícios principais (têm prioridade) e depois os auxiliares.
  const main = draftMainBlock({ ctx, targetCtx, byId, focus, goal: profile.goal, energyLevel, plan, exerciseCount });
  const warmup = buildWarmupBlock(ctx, availableMinutes);
  const cooldown = buildCooldownBlock(ctx, availableMinutes);
  const finisher = hasFinisher ? buildFinisherBlock(ctx, targetCtx, profile.goal, availableMinutes) : null;

  // 3. Encaixar o bloco principal no tempo que realmente sobra.
  const auxiliarySec = estimateBlocksDurationSec([warmup, cooldown, finisher].filter((b): b is GeneratedBlock => b != null), byId);
  const mainBudgetSec = Math.max(MIN_MAIN_BUDGET_SEC, budgetSec - auxiliarySec);
  const mainBlock = fitMainBlock(main.block, byId, mainBudgetSec, plan, { allowScaleUp: !targetCtx.reduced, tolerance: FIT_TOLERANCE });

  const blocks = orderBlocks([warmup, mainBlock, finisher, cooldown]);
  const estimatedDurationMin = summarizeWorkoutDuration(blocks, pool);
  const requiredEquipment = collectRequiredEquipment(blocks, byId);

  return {
    name: `${WORKOUT_NAME_BY_FOCUS[focus]} · ${params.availableMinutes} min`,
    description: `${WORKOUT_FORMAT_LABELS[plan.format]} de ${mainBlock.exercises.length} exercícios para ${FITNESS_GOAL_LABELS[profile.goal].toLowerCase()}, com aquecimento e retorno à calma.`,
    focus,
    difficulty: averageDifficulty(main.exercises),
    estimatedDurationMin,
    requiredEquipment,
    blocks,
    explanation: buildExplanation({
      availableMinutes,
      energyLevel,
      mode,
      focus,
      requiredEquipment,
      mainBlock,
      hasFinisher: finisher != null,
      swaps: main.swaps,
    }),
    generatorVersion: GENERATOR_VERSION,
    generationInput: echoParams(params),
  };
}

export { summarizeWorkoutDuration } from './duration';
export { mapTrainingFocusToWorkoutFocus } from './focus';
