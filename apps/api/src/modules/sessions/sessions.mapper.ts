import type { Prisma, SessionSet as SessionSetRow } from '@tlc/database';
import type { Session, SessionSet, SessionSummary, Workout } from '@tlc/shared';
import { localizeExercise } from '../../common/localization/localization';
import { toIso, toNumber } from '../../common/mapping/primitives';
import type { SessionRow, SessionSummaryRow } from './sessions.selectors';

/** Snapshot imutável guardado em `WorkoutSession.workoutSnapshot`. */
export type WorkoutSnapshot = Session['workout'];

export const FREE_SESSION_SNAPSHOT: WorkoutSnapshot = {
  name: 'Treino livre',
  focus: 'FULL_BODY',
  difficulty: 1,
  estimatedDurationMin: 30,
  blocks: [],
};

export function toWorkoutSnapshot(workout: Workout): WorkoutSnapshot {
  return {
    name: workout.name,
    focus: workout.focus,
    difficulty: workout.difficulty,
    estimatedDurationMin: workout.estimatedDurationMin,
    blocks: workout.blocks,
  };
}

/** Lê o snapshot JSON; tolera dados antigos/incompletos caindo no treino livre. */
export function readSnapshot(json: Prisma.JsonValue): WorkoutSnapshot {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return FREE_SESSION_SNAPSHOT;
  const snapshot = json as Partial<WorkoutSnapshot>;
  return {
    name: typeof snapshot.name === 'string' ? snapshot.name : FREE_SESSION_SNAPSHOT.name,
    focus: snapshot.focus ?? FREE_SESSION_SNAPSHOT.focus,
    difficulty: typeof snapshot.difficulty === 'number' ? snapshot.difficulty : FREE_SESSION_SNAPSHOT.difficulty,
    estimatedDurationMin:
      typeof snapshot.estimatedDurationMin === 'number' ? snapshot.estimatedDurationMin : FREE_SESSION_SNAPSHOT.estimatedDurationMin,
    blocks: Array.isArray(snapshot.blocks) ? snapshot.blocks : [],
  };
}

export function toSessionSet(row: SessionSetRow): SessionSet {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    workoutExerciseId: row.workoutExerciseId,
    blockOrder: row.blockOrder,
    round: row.round,
    order: row.order,
    targetReps: row.targetReps,
    targetDurationSec: row.targetDurationSec,
    repsCompleted: row.repsCompleted,
    durationSec: row.durationSec,
    distanceM: row.distanceM,
    loadKg: toNumber(row.loadKg),
    rpe: row.rpe,
    skipped: row.skipped,
    adjustmentReason: row.adjustmentReason,
    substitutedFromId: row.substitutedFromId,
    completedAt: toIso(row.completedAt),
  };
}

function toSessionBase(row: SessionRow | SessionSummaryRow): Omit<Session, 'workout' | 'sets' | 'newRecords'> {
  return {
    id: row.id,
    workoutId: row.workoutId,
    status: row.status,
    source: row.source,
    startedAt: toIso(row.startedAt),
    completedAt: toIso(row.completedAt),
    durationSec: row.durationSec,
    energyBefore: row.energyBefore,
    rpe: row.rpe,
    moodAfter: row.moodAfter,
    rating: row.rating,
    notes: row.notes,
    estimatedCalories: row.estimatedCalories,
  };
}

export function toSession(row: SessionRow, locale: string): Session {
  return {
    ...toSessionBase(row),
    workout: readSnapshot(row.workoutSnapshot),
    sets: row.sets.map(toSessionSet),
    newRecords: row.personalRecords.map((record) => ({
      exerciseId: record.exerciseId,
      exerciseName: localizeExercise(record.exercise, locale).name,
      metric: record.metric,
      value: toNumber(record.value),
    })),
  };
}

export function toSessionSummary(row: SessionSummaryRow): SessionSummary {
  const snapshot = readSnapshot(row.workoutSnapshot);
  return { ...toSessionBase(row), workoutName: snapshot.name, focus: snapshot.focus, setCount: row._count.sets };
}
