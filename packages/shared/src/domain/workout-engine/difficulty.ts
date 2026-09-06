/**
 * Dificuldade-alvo do treino: parte do nível do utilizador e ajusta-se pela
 * energia do dia e pelo modo de vida (doente, férias, …).
 */
import type { FitnessLevel, TrainingMode } from '../../constants/enums';

/** Intervalo inclusivo de dificuldade (1–5). */
export interface DifficultyRange {
  min: number;
  max: number;
}

/** Intervalo base por nível de forma física. */
const RANGE_BY_LEVEL: Record<FitnessLevel, DifficultyRange> = {
  BEGINNER: { min: 1, max: 2 },
  INTERMEDIATE: { min: 2, max: 3 },
  ADVANCED: { min: 3, max: 4 },
  ATHLETE: { min: 4, max: 5 },
};

/** Modos em que baixamos a dificuldade e limitamos o volume. */
const REDUCED_MODES: ReadonlySet<TrainingMode> = new Set(['SICK', 'RECOVERING', 'PAUSED']);

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** True quando o modo pede um treino mais leve (doente, recuperação, pausa). */
export function isReducedMode(mode: TrainingMode): boolean {
  return REDUCED_MODES.has(mode);
}

/** True quando a energia do dia é baixa (1–2). */
export function isLowEnergy(energyLevel: number): boolean {
  return energyLevel <= 2;
}

/** Deslocamento a aplicar ao intervalo base: energia baixa −1, energia máxima +1. */
function energyOffset(energyLevel: number): number {
  if (isLowEnergy(energyLevel)) return -1;
  if (energyLevel >= 5) return 1;
  return 0;
}

/**
 * Calcula o intervalo de dificuldade-alvo, já com os ajustes de energia e modo.
 * O resultado fica sempre dentro de 1..5.
 */
export function computeTargetDifficulty(level: FitnessLevel, energyLevel: number, mode: TrainingMode): DifficultyRange {
  const base = RANGE_BY_LEVEL[level];
  const offset = energyOffset(energyLevel) + (isReducedMode(mode) ? -1 : 0);
  return {
    min: clamp(base.min + offset, 1, 5),
    max: clamp(base.max + offset, 1, 5),
  };
}

/** Ponto médio do intervalo, usado para calcular o "delta" de cada exercício. */
export function difficultyCenter(range: DifficultyRange): number {
  return (range.min + range.max) / 2;
}

export function isWithinRange(difficulty: number, range: DifficultyRange): boolean {
  return difficulty >= range.min && difficulty <= range.max;
}

/**
 * Pode subir para a variante mais difícil? Só quando há energia de sobra
 * (≥ 4) e o modo é normal.
 */
export function allowsHarderVariant(energyLevel: number, mode: TrainingMode): boolean {
  return energyLevel >= 4 && mode === 'NORMAL';
}
