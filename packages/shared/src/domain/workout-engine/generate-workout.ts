import type { EngineExercise, GenerateWorkoutParams, GeneratedWorkout } from './types';

export const GENERATOR_VERSION = '1.0.0';

/**
 * Gera um treino a partir do perfil, do tempo disponível, da energia do dia e
 * do equipamento à mão. Função pura e determinística para a mesma `seed`.
 * (Implementação em curso.)
 */
export function generateWorkout(_params: GenerateWorkoutParams, _catalog: EngineExercise[]): GeneratedWorkout {
  throw new Error('generateWorkout: not implemented yet');
}
