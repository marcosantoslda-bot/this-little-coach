/**
 * Catálogo fictício para testes do motor: cobre todos os padrões de movimento,
 * vários equipamentos e ligações easier/harder.
 */
import type { EngineExercise } from '../types';

type Draft = Partial<EngineExercise> & Pick<EngineExercise, 'id' | 'movementPattern' | 'primaryMuscles' | 'difficulty'>;

function exercise(draft: Draft): EngineExercise {
  return {
    slug: draft.id,
    name: draft.id.replace(/-/g, ' '),
    category: 'STRENGTH',
    secondaryMuscles: [],
    equipment: ['NONE'],
    metric: 'REPS',
    isUnilateral: false,
    metValue: 6,
    easierIds: [],
    harderIds: [],
    ...draft,
  };
}

export const FIXTURE_CATALOG: EngineExercise[] = [
  // Pernas (peso do corpo)
  exercise({ id: 'air-squat', movementPattern: 'SQUAT', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 1, harderIds: ['jump-squat', 'pistol-squat'] }),
  exercise({ id: 'jump-squat', movementPattern: 'JUMP', category: 'PLYOMETRIC', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 3, easierIds: ['air-squat'], metValue: 8 }),
  exercise({ id: 'pistol-squat', movementPattern: 'SQUAT', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 5, isUnilateral: true, easierIds: ['air-squat'] }),
  exercise({ id: 'reverse-lunge', movementPattern: 'LUNGE', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 2, isUnilateral: true, harderIds: ['jumping-lunge'] }),
  exercise({ id: 'jumping-lunge', movementPattern: 'LUNGE', category: 'PLYOMETRIC', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 4, isUnilateral: true, easierIds: ['reverse-lunge'] }),
  exercise({ id: 'wall-sit', movementPattern: 'ISOMETRIC', primaryMuscles: ['QUADS'], difficulty: 2, metric: 'DURATION' }),
  exercise({ id: 'glute-bridge', movementPattern: 'HINGE', primaryMuscles: ['GLUTES', 'HAMSTRINGS'], difficulty: 1, harderIds: ['single-leg-glute-bridge'] }),
  exercise({ id: 'single-leg-glute-bridge', movementPattern: 'HINGE', primaryMuscles: ['GLUTES', 'HAMSTRINGS'], difficulty: 3, isUnilateral: true, easierIds: ['glute-bridge'] }),
  exercise({ id: 'superman', movementPattern: 'HINGE', primaryMuscles: ['LOWER_BACK', 'GLUTES'], difficulty: 1 }),
  // Empurrar / puxar
  exercise({ id: 'incline-push-up', movementPattern: 'PUSH_HORIZONTAL', primaryMuscles: ['CHEST', 'TRICEPS'], difficulty: 1, harderIds: ['push-up'] }),
  exercise({ id: 'push-up', movementPattern: 'PUSH_HORIZONTAL', primaryMuscles: ['CHEST', 'TRICEPS'], difficulty: 3, easierIds: ['incline-push-up'], harderIds: ['decline-push-up'] }),
  exercise({ id: 'decline-push-up', movementPattern: 'PUSH_HORIZONTAL', primaryMuscles: ['CHEST', 'SHOULDERS'], difficulty: 4, easierIds: ['push-up'] }),
  exercise({ id: 'pike-push-up', movementPattern: 'PUSH_VERTICAL', primaryMuscles: ['SHOULDERS', 'TRICEPS'], difficulty: 3 }),
  exercise({ id: 'inverted-row', movementPattern: 'PULL_HORIZONTAL', primaryMuscles: ['UPPER_BACK', 'BICEPS'], difficulty: 2, equipment: ['PULL_UP_BAR'], harderIds: ['pull-up'] }),
  exercise({ id: 'pull-up', movementPattern: 'PULL_VERTICAL', primaryMuscles: ['LATS', 'BICEPS'], difficulty: 4, equipment: ['PULL_UP_BAR'], easierIds: ['inverted-row'] }),
  exercise({ id: 'band-row', movementPattern: 'PULL_HORIZONTAL', primaryMuscles: ['UPPER_BACK'], difficulty: 2, equipment: ['RESISTANCE_BAND'] }),
  // Core
  exercise({ id: 'plank', movementPattern: 'ISOMETRIC', category: 'CORE', primaryMuscles: ['CORE'], difficulty: 1, metric: 'DURATION', harderIds: ['side-plank'] }),
  exercise({ id: 'side-plank', movementPattern: 'ISOMETRIC', category: 'CORE', primaryMuscles: ['OBLIQUES'], difficulty: 2, metric: 'DURATION', isUnilateral: true, easierIds: ['plank'] }),
  exercise({ id: 'dead-bug', movementPattern: 'ANTI_ROTATION', category: 'CORE', primaryMuscles: ['CORE'], difficulty: 1 }),
  exercise({ id: 'russian-twist', movementPattern: 'ROTATION', category: 'CORE', primaryMuscles: ['OBLIQUES'], difficulty: 2 }),
  exercise({ id: 'hollow-hold', movementPattern: 'ISOMETRIC', category: 'CORE', primaryMuscles: ['CORE', 'HIP_FLEXORS'], difficulty: 3, metric: 'DURATION' }),
  // Cardio / pliometria
  exercise({ id: 'jumping-jack', movementPattern: 'LOCOMOTION', category: 'CARDIO', primaryMuscles: ['CARDIOVASCULAR'], difficulty: 1, metric: 'DURATION', metValue: 8 }),
  exercise({ id: 'high-knees', movementPattern: 'LOCOMOTION', category: 'CARDIO', primaryMuscles: ['CARDIOVASCULAR', 'HIP_FLEXORS'], difficulty: 2, metric: 'DURATION', metValue: 9 }),
  exercise({ id: 'mountain-climber', movementPattern: 'LOCOMOTION', category: 'CARDIO', primaryMuscles: ['CORE', 'CARDIOVASCULAR'], difficulty: 2, metric: 'DURATION', metValue: 8 }),
  exercise({ id: 'burpee', movementPattern: 'JUMP', category: 'PLYOMETRIC', primaryMuscles: ['FULL_BODY', 'CARDIOVASCULAR'], difficulty: 4, metValue: 10 }),
  exercise({ id: 'jump-rope', movementPattern: 'LOCOMOTION', category: 'CARDIO', primaryMuscles: ['CALVES', 'CARDIOVASCULAR'], difficulty: 2, metric: 'DURATION', equipment: ['JUMP_ROPE'], metValue: 11 }),
  exercise({ id: 'farmer-carry', movementPattern: 'CARRY', primaryMuscles: ['FOREARMS', 'CORE'], difficulty: 2, metric: 'DISTANCE', equipment: ['DUMBBELLS'] }),
  // Com halteres / kettlebell
  exercise({ id: 'goblet-squat', movementPattern: 'SQUAT', primaryMuscles: ['QUADS', 'GLUTES'], difficulty: 2, equipment: ['DUMBBELLS'] }),
  exercise({ id: 'dumbbell-rdl', movementPattern: 'HINGE', primaryMuscles: ['HAMSTRINGS', 'GLUTES'], difficulty: 3, equipment: ['DUMBBELLS'] }),
  exercise({ id: 'kettlebell-swing', movementPattern: 'HINGE', primaryMuscles: ['GLUTES', 'HAMSTRINGS'], difficulty: 3, equipment: ['KETTLEBELL'], metValue: 9 }),
  // Mobilidade
  exercise({ id: 'cat-cow', movementPattern: 'ROTATION', category: 'MOBILITY', primaryMuscles: ['LOWER_BACK'], difficulty: 1, metric: 'DURATION', metValue: 2.5 }),
  exercise({ id: 'hip-circles', movementPattern: 'ROTATION', category: 'MOBILITY', primaryMuscles: ['HIP_FLEXORS'], difficulty: 1, metric: 'DURATION', metValue: 2.5 }),
  exercise({ id: 'arm-circles', movementPattern: 'ROTATION', category: 'MOBILITY', primaryMuscles: ['SHOULDERS'], difficulty: 1, metric: 'DURATION', metValue: 2.5 }),
  exercise({ id: 'inchworm', movementPattern: 'LOCOMOTION', category: 'MOBILITY', primaryMuscles: ['HAMSTRINGS', 'CORE'], difficulty: 2, metric: 'DURATION', metValue: 3.5 }),
  exercise({ id: 'leg-swings', movementPattern: 'LOCOMOTION', category: 'MOBILITY', primaryMuscles: ['HIP_FLEXORS'], difficulty: 1, metric: 'DURATION', isUnilateral: true, metValue: 2.5 }),
  // Alongamentos
  exercise({ id: 'hamstring-stretch', movementPattern: 'HINGE', category: 'STRETCH', primaryMuscles: ['HAMSTRINGS'], difficulty: 1, metric: 'DURATION', metValue: 2 }),
  exercise({ id: 'quad-stretch', movementPattern: 'ISOMETRIC', category: 'STRETCH', primaryMuscles: ['QUADS'], difficulty: 1, metric: 'DURATION', isUnilateral: true, metValue: 2 }),
  exercise({ id: 'child-pose', movementPattern: 'ISOMETRIC', category: 'STRETCH', primaryMuscles: ['LOWER_BACK'], difficulty: 1, metric: 'DURATION', metValue: 2 }),
  exercise({ id: 'chest-stretch', movementPattern: 'ISOMETRIC', category: 'STRETCH', primaryMuscles: ['CHEST'], difficulty: 1, metric: 'DURATION', metValue: 2 }),
  exercise({ id: 'hip-flexor-stretch', movementPattern: 'LUNGE', category: 'STRETCH', primaryMuscles: ['HIP_FLEXORS'], difficulty: 1, metric: 'DURATION', isUnilateral: true, equipment: ['MAT'], metValue: 2 }),
  exercise({ id: 'pigeon-stretch', movementPattern: 'ISOMETRIC', category: 'STRETCH', primaryMuscles: ['GLUTES'], difficulty: 1, metric: 'DURATION', isUnilateral: true, equipment: ['MAT'], metValue: 2 }),
];

export const FIXTURE_BY_ID = new Map(FIXTURE_CATALOG.map((e) => [e.id, e]));
