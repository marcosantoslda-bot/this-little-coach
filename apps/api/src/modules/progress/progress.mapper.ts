import type { BodyMeasurement as MeasurementRow } from '@tlc/database';
import type { BodyMeasurement, PersonalRecord } from '@tlc/shared';
import { localizeExercise } from '../../common/localization/localization';
import { toIso, toIsoDate, toNumber } from '../../common/mapping/primitives';
import type { RecordRow } from './progress.selectors';

export function toBodyMeasurement(row: MeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    measuredAt: toIsoDate(row.measuredAt),
    source: row.source,
    weightKg: toNumber(row.weightKg),
    bodyFatPct: toNumber(row.bodyFatPct),
    waistCm: toNumber(row.waistCm),
    hipCm: toNumber(row.hipCm),
    chestCm: toNumber(row.chestCm),
    notes: row.notes,
  };
}

export function toPersonalRecord(row: RecordRow, locale: string): PersonalRecord {
  return {
    exerciseId: row.exerciseId,
    exerciseName: localizeExercise(row.exercise, locale).name,
    metric: row.metric,
    value: toNumber(row.value),
    achievedAt: toIso(row.achievedAt),
    sessionId: row.sessionId,
  };
}
