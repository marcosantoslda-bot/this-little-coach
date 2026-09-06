/**
 * Seleção de exercícios: filtragem do catálogo, escolha por vaga (padrão de
 * movimento) e troca por variantes mais fáceis/difíceis para bater a
 * dificuldade-alvo.
 */
import type { Equipment, MuscleGroup } from '../../constants/enums';
import type { DifficultyRange } from './difficulty';
import { isWithinRange } from './difficulty';
import type { ExercisePredicate, PatternSlot } from './focus';
import type { Rng } from './random';
import { pickRandom } from './random';
import type { EngineExercise } from './types';

// ── Filtragem ───────────────────────────────────────────────────────────────

/** `NONE` conta sempre como disponível: é o "peso do corpo". */
function isEquipmentAvailable(required: readonly Equipment[], available: ReadonlySet<Equipment>): boolean {
  return required.every((item) => item === 'NONE' || available.has(item));
}

function touchesRestrictedMuscle(exercise: EngineExercise, restricted: ReadonlySet<MuscleGroup>): boolean {
  return exercise.primaryMuscles.some((muscle) => restricted.has(muscle));
}

/** Mantém apenas exercícios exequíveis com o equipamento à mão e sem músculos restritos. */
export function filterCatalog(catalog: readonly EngineExercise[], equipment: readonly Equipment[], restrictedMuscles: readonly MuscleGroup[]): EngineExercise[] {
  const available = new Set<Equipment>(equipment);
  const restricted = new Set<MuscleGroup>(restrictedMuscles);
  return catalog.filter((e) => isEquipmentAvailable(e.equipment, available) && !touchesRestrictedMuscle(e, restricted));
}

// ── Contexto de seleção ─────────────────────────────────────────────────────

export interface SelectionContext {
  rng: Rng;
  /** Catálogo já filtrado (equipamento + restrições). */
  pool: readonly EngineExercise[];
  poolById: ReadonlyMap<string, EngineExercise>;
  /** Exercícios já usados neste treino — nunca repetimos. */
  used: Set<string>;
  target: DifficultyRange;
  allowHarder: boolean;
}

export interface ExerciseSwap {
  from: EngineExercise;
  to: EngineExercise;
  direction: 'easier' | 'harder';
}

export interface SlotSelection {
  exercises: EngineExercise[];
  swaps: ExerciseSwap[];
}

const unusedIn = (ctx: SelectionContext): ExercisePredicate => (e) => !ctx.used.has(e.id);

function markUsed(ctx: SelectionContext, exercise: EngineExercise): EngineExercise {
  ctx.used.add(exercise.id);
  return exercise;
}

// ── Troca por variantes ─────────────────────────────────────────────────────

/** Variantes ligadas que estão no catálogo filtrado e ainda não foram usadas. */
function availableVariants(ctx: SelectionContext, ids: readonly string[]): EngineExercise[] {
  return ids
    .map((id) => ctx.poolById.get(id))
    .filter((e): e is EngineExercise => e != null && !ctx.used.has(e.id));
}

/** Direção em que o exercício precisa de ser trocado para caber no alvo (ou nenhuma). */
function neededDirection(ctx: SelectionContext, exercise: EngineExercise): ExerciseSwap['direction'] | null {
  if (exercise.difficulty > ctx.target.max) return 'easier';
  if (exercise.difficulty < ctx.target.min && ctx.allowHarder) return 'harder';
  return null;
}

/** Escolhe, de forma determinística, a variante que mais se aproxima do alvo. */
function closestVariant(ctx: SelectionContext, variants: readonly EngineExercise[]): EngineExercise | undefined {
  const distance = (e: EngineExercise): number =>
    Math.max(0, ctx.target.min - e.difficulty, e.difficulty - ctx.target.max);
  return [...variants].sort((a, b) => distance(a) - distance(b) || a.id.localeCompare(b.id))[0];
}

/**
 * Segue as ligações easier/harder (no máximo 3 passos) até o exercício cair
 * dentro do intervalo-alvo. Devolve o exercício final e as trocas feitas.
 */
export function adjustToTargetDifficulty(ctx: SelectionContext, exercise: EngineExercise): { exercise: EngineExercise; swaps: ExerciseSwap[] } {
  const swaps: ExerciseSwap[] = [];
  let current = exercise;
  for (let step = 0; step < 3; step++) {
    const direction = neededDirection(ctx, current);
    if (direction == null) break;
    const next = closestVariant(ctx, availableVariants(ctx, direction === 'easier' ? current.easierIds : current.harderIds));
    if (next == null) break;
    swaps.push({ from: current, to: next, direction });
    current = next;
  }
  return { exercise: current, swaps };
}

// ── Escolha por vaga ────────────────────────────────────────────────────────

function sharesPrimaryMuscle(a: EngineExercise, b: EngineExercise | undefined): boolean {
  if (b == null) return false;
  return a.primaryMuscles.some((muscle) => b.primaryMuscles.includes(muscle));
}

/**
 * Dificuldade dentro do alvo, ou alcançável seguindo as variantes ligadas
 * (simula a cadeia completa: uma variante intermédia já usada não conta).
 */
function fitsTarget(ctx: SelectionContext, exercise: EngineExercise): boolean {
  if (isWithinRange(exercise.difficulty, ctx.target)) return true;
  return isWithinRange(adjustToTargetDifficulty(ctx, exercise).exercise.difficulty, ctx.target);
}

/**
 * Aceitável na primeira passagem: bate ao alvo, ou é no máximo um nível mais
 * fácil. Mais difícil do que o alvo nunca passa aqui (segurança primeiro).
 */
function isAcceptable(ctx: SelectionContext, exercise: EngineExercise): boolean {
  return fitsTarget(ctx, exercise) || (exercise.difficulty >= ctx.target.min - 1 && exercise.difficulty <= ctx.target.max);
}

/**
 * Entre os candidatos, prefere (1) músculo primário diferente do anterior e
 * (2) dificuldade dentro do alvo ou alcançável por troca. Cai para o nível
 * seguinte quando o filtro esvazia a lista.
 */
function chooseCandidate(ctx: SelectionContext, candidates: readonly EngineExercise[], previous: EngineExercise | undefined): EngineExercise | undefined {
  const differentMuscle = candidates.filter((e) => !sharesPrimaryMuscle(e, previous));
  const base = differentMuscle.length > 0 ? differentMuscle : candidates;
  const fitting = base.filter((e) => fitsTarget(ctx, e));
  return pickRandom(ctx.rng, fitting.length > 0 ? fitting : base);
}

/**
 * Tenta o padrão pedido, depois o plano B da vaga, depois qualquer exercício do
 * pool. Primeiro só aceita exercícios ao alvo (ou até um nível abaixo) em
 * toda a cadeia; só depois aceita o que houver.
 */
function selectForSlot(ctx: SelectionContext, slot: PatternSlot, pool: readonly EngineExercise[], previous: EngineExercise | undefined): EngineExercise | undefined {
  const unused = unusedIn(ctx);
  const attempts: ExercisePredicate[] = [slot.matches, slot.fallback ?? (() => false), () => true];
  for (const strict of [true, false]) {
    for (const predicate of attempts) {
      const candidates = pool.filter((e) => unused(e) && predicate(e) && (!strict || isAcceptable(ctx, e)));
      const chosen = chooseCandidate(ctx, candidates, previous);
      if (chosen != null) return chosen;
    }
  }
  return undefined;
}

/**
 * Preenche as vagas do bloco principal a partir de `pool` (já sem mobilidade
 * e alongamentos). Se o catálogo for pequeno, devolve menos exercícios em vez
 * de falhar.
 */
export function selectForSlots(ctx: SelectionContext, slots: readonly PatternSlot[], pool: readonly EngineExercise[]): SlotSelection {
  const exercises: EngineExercise[] = [];
  const swaps: ExerciseSwap[] = [];
  for (const slot of slots) {
    const picked = selectForSlot(ctx, slot, pool, exercises[exercises.length - 1]);
    if (picked == null) break;
    ctx.used.add(picked.id);
    const adjusted = adjustToTargetDifficulty(ctx, picked);
    if (adjusted.exercise !== picked) {
      ctx.used.delete(picked.id);
      markUsed(ctx, adjusted.exercise);
    }
    exercises.push(adjusted.exercise);
    swaps.push(...adjusted.swaps);
  }
  return { exercises, swaps };
}

/**
 * Escolhe até `count` exercícios seguindo uma lista de preferências (a primeira
 * que tiver candidatos ganha; as seguintes só entram se ainda faltarem vagas).
 * Usado no aquecimento, finisher e retorno à calma.
 */
export function selectByPreference(ctx: SelectionContext, preferences: readonly ExercisePredicate[], count: number): EngineExercise[] {
  const chosen: EngineExercise[] = [];
  for (const predicate of preferences) {
    while (chosen.length < count) {
      const candidates = ctx.pool.filter((e) => !ctx.used.has(e.id) && predicate(e));
      const picked = chooseCandidate(ctx, candidates, chosen[chosen.length - 1]);
      if (picked == null) break;
      chosen.push(markUsed(ctx, picked));
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}
