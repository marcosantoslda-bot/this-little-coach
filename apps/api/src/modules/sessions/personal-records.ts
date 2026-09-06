import type { RecordMetric } from '@tlc/shared';
import { toNumber } from '../../common/mapping/primitives';

/** Série tal como é preciso para calcular recordes (subconjunto de SessionSet). */
export interface RecordSetLike {
  exerciseId: string;
  skipped: boolean;
  repsCompleted: number | null;
  durationSec: number | null;
  loadKg: { toNumber(): number } | number | null;
  completedAt: Date;
}

export interface RecordCandidate {
  exerciseId: string;
  metric: RecordMetric;
  value: number;
  achievedAt: Date;
}

export const recordKey = (exerciseId: string, metric: RecordMetric): string => `${exerciseId}:${metric}`;

/** Melhor valor por (exercício, métrica) entre as séries da sessão. */
export function collectRecordCandidates(sets: RecordSetLike[]): RecordCandidate[] {
  const best = new Map<string, RecordCandidate>();
  const consider = (set: RecordSetLike, metric: RecordMetric, value: number | null) => {
    if (value === null || value <= 0) return;
    const key = recordKey(set.exerciseId, metric);
    const current = best.get(key);
    if (!current || value > current.value) {
      best.set(key, { exerciseId: set.exerciseId, metric, value, achievedAt: set.completedAt });
    }
  };

  for (const set of sets) {
    if (set.skipped) continue;
    consider(set, 'MAX_REPS', set.repsCompleted);
    consider(set, 'MAX_DURATION_SEC', set.durationSec);
    consider(set, 'MAX_LOAD_KG', toNumber(set.loadKg));
  }
  return [...best.values()];
}

/** Mantém só os candidatos que batem o recorde existente (ou que não têm recorde). */
export function selectNewRecords(candidates: RecordCandidate[], existing: Map<string, number>): RecordCandidate[] {
  return candidates.filter((candidate) => {
    const current = existing.get(recordKey(candidate.exerciseId, candidate.metric));
    return current === undefined || candidate.value > current;
  });
}
