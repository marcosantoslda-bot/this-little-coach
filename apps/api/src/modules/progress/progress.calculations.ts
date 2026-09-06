import type { MovementPattern, ProgressOverview } from '@tlc/shared';
import { previousWeekStart, startOfWeekInZone, weekKey } from '../../common/time/week';

export interface WeekSessionLike {
  durationSec: number | null;
  estimatedCalories: number | null;
  sets: { skipped: boolean; exercise: { movementPattern: MovementPattern } }[];
}

export function computeWeekStats(sessions: WeekSessionLike[], sessionsTarget: number): ProgressOverview['week'] {
  const setsByPattern: Partial<Record<MovementPattern, number>> = {};
  let totalSets = 0;
  let totalSeconds = 0;
  let estimatedCalories = 0;

  for (const session of sessions) {
    totalSeconds += session.durationSec ?? 0;
    estimatedCalories += session.estimatedCalories ?? 0;
    for (const set of session.sets) {
      if (set.skipped) continue;
      totalSets += 1;
      const pattern = set.exercise.movementPattern;
      setsByPattern[pattern] = (setsByPattern[pattern] ?? 0) + 1;
    }
  }

  return {
    sessionsCompleted: sessions.length,
    sessionsTarget,
    totalMinutes: Math.round(totalSeconds / 60),
    totalSets,
    estimatedCalories,
    setsByPattern,
  };
}

/**
 * Semanas consecutivas (terminando nesta semana ou na anterior) com >= 1 sessão concluída.
 * A semana atual ainda a decorrer não quebra a sequência.
 */
export function computeStreakWeeks(completionDates: Date[], now: Date, timeZone: string): number {
  const weeks = new Set(completionDates.map((d) => weekKey(d, timeZone)));
  let cursor = startOfWeekInZone(now, timeZone);
  if (!weeks.has(weekKey(cursor, timeZone))) {
    cursor = previousWeekStart(cursor, timeZone);
  }
  let streak = 0;
  while (weeks.has(weekKey(cursor, timeZone))) {
    streak += 1;
    cursor = previousWeekStart(cursor, timeZone);
  }
  return streak;
}

export interface WeightPoint {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_WINDOW_DAYS = 7;
const TREND_TOLERANCE_DAYS = 3;

/**
 * Tendência a 7 dias: peso mais recente menos o peso registado ~7 dias antes
 * (o registo mais próximo de -7d, com tolerância de ±3 dias). `null` se não houver.
 */
export function computeWeightTrend7d(history: WeightPoint[]): number | null {
  if (history.length < 2) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1]!;
  const latestMs = Date.parse(`${latest.date}T00:00:00Z`);
  const targetMs = latestMs - TREND_WINDOW_DAYS * DAY_MS;

  let best: { point: WeightPoint; distance: number } | null = null;
  for (const point of sorted.slice(0, -1)) {
    const distance = Math.abs(Date.parse(`${point.date}T00:00:00Z`) - targetMs);
    if (distance <= TREND_TOLERANCE_DAYS * DAY_MS && (!best || distance < best.distance)) {
      best = { point, distance };
    }
  }
  if (!best) return null;
  return Math.round((latest.weightKg - best.point.weightKg) * 100) / 100;
}
