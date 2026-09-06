import type { RecordMetric, WorkoutExercise } from '@tlc/shared';
import { formatDuration } from '@tlc/shared';

const dateLong = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const dateShort = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });
const dateTime = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "Sábado, 6 de setembro" */
export function formatDateLong(d: Date = new Date()): string {
  return capitalize(dateLong.format(d));
}

/** "6 set." */
export function formatDateShort(iso: string): string {
  return dateShort.format(new Date(iso));
}

/** "6 set., 18:30" */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatMinutes(min: number): string {
  return `${min} min`;
}

export function secondsToMinutes(sec: number | null | undefined): number {
  return Math.max(0, Math.round((sec ?? 0) / 60));
}

/** Alvo de um exercício num treino: "12 reps", "40 s", "200 m". */
export function formatTarget(
  we: Pick<WorkoutExercise, 'targetReps' | 'targetDurationSec' | 'targetDistanceM'>,
): string {
  if (we.targetDurationSec != null) return `${we.targetDurationSec} s`;
  if (we.targetReps != null) return `${we.targetReps} reps`;
  if (we.targetDistanceM != null) return `${we.targetDistanceM} m`;
  return 'Livre';
}

/** Número decimal em pt-PT com 1 casa ("72,4"). */
export function formatKg(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

/** Variação com sinal ("−0,4 kg", "+0,2 kg", "0,0 kg"). */
export function formatDeltaKg(delta: number): string {
  const abs = formatKg(Math.abs(delta));
  if (delta < -0.05) return `−${abs} kg`;
  if (delta > 0.05) return `+${abs} kg`;
  return `${abs} kg`;
}

export function formatRecordValue(metric: RecordMetric, value: number): string {
  switch (metric) {
    case 'MAX_REPS':
      return `${value} reps`;
    case 'MAX_DURATION_SEC':
    case 'FASTEST_TIME_SEC':
      return formatDuration(Math.round(value));
    case 'MAX_LOAD_KG':
      return `${formatKg(value)} kg`;
    case 'MAX_DISTANCE_M':
      return `${value} m`;
  }
}

/** "●●●○○" — dificuldade 1–5 sem cor. */
export function difficultyDots(difficulty: number): string {
  const d = Math.max(0, Math.min(5, Math.round(difficulty)));
  return '●'.repeat(d) + '○'.repeat(5 - d);
}

/** Aceita "72,4" ou "72.4"; devolve null se não for número. */
export function parseDecimal(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
