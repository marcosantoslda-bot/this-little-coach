/**
 * Cálculos derivados dos dados de seed: pares de progressão e metadados de treino
 * (duração estimada, equipamento necessário). Puro, sem Prisma — testável.
 */
import type { Equipment } from '@prisma/client';
import type { ResolvedSeedWorkout, SeedExercise, SeedWorkout, SeedWorkoutBlock } from './types';

export interface ProgressionPair {
  easier: string;
  harder: string;
}

/**
 * Constrói a lista de progressões (easier -> harder) a partir dos campos
 * `easier` e `harder` de cada exercício, sem duplicados.
 */
export function buildProgressionPairs(exercises: SeedExercise[]): ProgressionPair[] {
  const seen = new Set<string>();
  const pairs: ProgressionPair[] = [];
  const add = (easier: string, harder: string) => {
    const key = `${easier}=>${harder}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ easier, harder });
  };
  for (const ex of exercises) {
    for (const easier of ex.easier) add(easier, ex.slug);
    for (const harder of ex.harder ?? []) add(ex.slug, harder);
  }
  return pairs;
}

/** Segundos assumidos por repetição (tempo médio 2-0-1-0). */
export const SEC_PER_REP = 3;
/** Segundos de transição entre exercícios (mudar de posição, ler o ecrã). */
export const TRANSITION_SEC = 5;

/** Segundos de trabalho de um exercício dentro de um bloco (ambos os lados se unilateral). */
export function exerciseWorkSec(
  entry: { targetReps?: number; targetDurationSec?: number },
  exercise: Pick<SeedExercise, 'isUnilateral'>,
): number {
  const base = entry.targetDurationSec ?? (entry.targetReps ?? 0) * SEC_PER_REP;
  return exercise.isUnilateral ? base * 2 : base;
}

export function blockDurationSec(block: SeedWorkoutBlock, bySlug: Map<string, SeedExercise>): number {
  if (block.timeCapSec != null) return block.timeCapSec;
  let round = 0;
  for (const entry of block.exercises) {
    const exercise = bySlug.get(entry.slug);
    if (!exercise) throw new Error(`Exercício desconhecido no treino: ${entry.slug}`);
    round += exerciseWorkSec(entry, exercise) + TRANSITION_SEC;
    round += entry.restAfterSec ?? block.restBetweenExercisesSec;
  }
  return round * block.rounds + block.restBetweenRoundsSec * Math.max(0, block.rounds - 1);
}

export function estimateWorkoutDurationMin(workout: SeedWorkout, bySlug: Map<string, SeedExercise>): number {
  const total = workout.blocks.reduce((sum, block) => sum + blockDurationSec(block, bySlug), 0);
  return Math.max(1, Math.round(total / 60));
}

/** União do equipamento de todos os exercícios; NONE só fica se nada mais for preciso. */
export function requiredEquipmentFor(workout: SeedWorkout, bySlug: Map<string, SeedExercise>): Equipment[] {
  const set = new Set<Equipment>();
  for (const block of workout.blocks) {
    for (const entry of block.exercises) {
      const exercise = bySlug.get(entry.slug);
      if (!exercise) throw new Error(`Exercício desconhecido no treino: ${entry.slug}`);
      for (const eq of exercise.equipment) set.add(eq);
    }
  }
  if (set.size > 1) set.delete('NONE');
  if (set.size === 0) set.add('NONE');
  return [...set];
}

export function resolveWorkout(workout: SeedWorkout, bySlug: Map<string, SeedExercise>): ResolvedSeedWorkout {
  return {
    ...workout,
    estimatedDurationMin: estimateWorkoutDurationMin(workout, bySlug),
    requiredEquipment: requiredEquipmentFor(workout, bySlug),
  };
}

/** Minutos anunciados no nome, ex.: "Core (15 min)" -> 15. */
export function minutesInName(name: string): number | null {
  const match = /\((\d+)\s*min\)/i.exec(name);
  return match?.[1] ? Number(match[1]) : null;
}
