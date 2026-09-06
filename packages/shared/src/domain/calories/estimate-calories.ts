/**
 * Estimativa de calorias por MET (Compendium of Physical Activities):
 *   kcal = MET × 3,5 × peso(kg) / 200 × minutos
 * Quando o exercício não tem MET, usa-se 6 (treino de força moderado).
 */
export const DEFAULT_MET = 6;

export interface CalorieInput {
  metValue: number | null;
  weightKg: number;
  durationSec: number;
}

export function estimateCalories({ metValue, weightKg, durationSec }: CalorieInput): number {
  if (weightKg <= 0 || durationSec <= 0) return 0;
  const met = metValue ?? DEFAULT_MET;
  const minutes = durationSec / 60;
  return Math.round((met * 3.5 * weightKg) / 200 * minutes);
}

/** Soma por sessão: cada parcela = tempo sob esforço de um exercício. */
export function estimateSessionCalories(parts: CalorieInput[]): number {
  return parts.reduce((acc, p) => acc + estimateCalories(p), 0);
}
