/**
 * Catálogo de exercícios (seed). Agrupado por ficheiro para ser fácil de manter;
 * a ordem aqui é a ordem de inserção.
 */
import type { SeedExercise } from './types';
import { PUSH_EXERCISES } from './exercises/push';
import { PULL_EXERCISES } from './exercises/pull';
import { SQUAT_EXERCISES } from './exercises/squat';
import { HINGE_EXERCISES } from './exercises/hinge';
import { LUNGE_EXERCISES } from './exercises/lunge';
import { CORE_EXERCISES } from './exercises/core';
import { CARDIO_EXERCISES } from './exercises/cardio';
import { MOBILITY_EXERCISES } from './exercises/mobility';
import { GYM_EXERCISES } from './exercises/gym';

export const EXERCISES: SeedExercise[] = [
  ...PUSH_EXERCISES,
  ...PULL_EXERCISES,
  ...SQUAT_EXERCISES,
  ...HINGE_EXERCISES,
  ...LUNGE_EXERCISES,
  ...CORE_EXERCISES,
  ...CARDIO_EXERCISES,
  ...MOBILITY_EXERCISES,
  ...GYM_EXERCISES,
];

/** Peso corporal puro: sem equipamento além (opcionalmente) de um tapete. */
export function isBodyweight(exercise: Pick<SeedExercise, 'equipment'>): boolean {
  return exercise.equipment.every((e) => e === 'NONE' || e === 'MAT');
}

export function exercisesBySlug(list: SeedExercise[] = EXERCISES): Map<string, SeedExercise> {
  return new Map(list.map((e) => [e.slug, e]));
}
