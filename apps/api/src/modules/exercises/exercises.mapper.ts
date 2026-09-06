import type { EngineExercise, Exercise } from '@tlc/shared';
import { localizeExercise } from '../../common/localization/localization';
import { toNumber } from '../../common/mapping/primitives';
import type { ExerciseRow } from './exercises.selectors';

export function toExercise(row: ExerciseRow, locale: string): Exercise {
  const text = localizeExercise(row, locale);
  return {
    id: row.id,
    slug: row.slug,
    name: text.name,
    description: text.description,
    cues: text.cues,
    category: row.category,
    movementPattern: row.movementPattern,
    primaryMuscles: row.primaryMuscles,
    secondaryMuscles: row.secondaryMuscles,
    equipment: row.equipment,
    difficulty: row.difficulty,
    metric: row.metric,
    isUnilateral: row.isUnilateral,
    metValue: toNumber(row.metValue),
    defaultTempo: row.defaultTempo,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl,
    easierIds: row.regressesTo.map((p) => p.easierId),
    harderIds: row.progressesTo.map((p) => p.harderId),
  };
}

/** Forma que o gerador de treinos (@tlc/shared) consome. */
export function toEngineExercise(row: ExerciseRow): EngineExercise {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    movementPattern: row.movementPattern,
    primaryMuscles: row.primaryMuscles,
    secondaryMuscles: row.secondaryMuscles,
    equipment: row.equipment,
    difficulty: row.difficulty,
    metric: row.metric,
    isUnilateral: row.isUnilateral,
    metValue: toNumber(row.metValue),
    easierIds: row.regressesTo.map((p) => p.easierId),
    harderIds: row.progressesTo.map((p) => p.harderId),
  };
}
