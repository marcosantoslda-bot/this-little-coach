/**
 * Etiquetas pt-PT para enums que ainda não têm mapa em @tlc/shared/labels.pt.ts.
 * Quando forem adicionadas ao pacote partilhado, remover daqui e importar de lá.
 */
import type { RecordMetric, Sex, TrainingLocation } from '@tlc/shared';

export const SEX_LABELS: Record<Sex, string> = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  OTHER: 'Outro',
  PREFER_NOT_TO_SAY: 'Prefiro não dizer',
};

export const TRAINING_LOCATION_LABELS: Record<TrainingLocation, string> = {
  HOME: 'Casa',
  GYM: 'Ginásio',
  OUTDOOR: 'Exterior',
  ANYWHERE: 'Qualquer lado',
};

export const RECORD_METRIC_LABELS: Record<RecordMetric, string> = {
  MAX_REPS: 'Máximo de reps',
  MAX_DURATION_SEC: 'Máximo de tempo',
  MAX_LOAD_KG: 'Máxima carga',
  FASTEST_TIME_SEC: 'Melhor tempo',
  MAX_DISTANCE_M: 'Máxima distância',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: 'Sem energia',
  2: 'Pouca energia',
  3: 'Normal',
  4: 'Com energia',
  5: 'Cheio de energia',
};

export const MOOD_LABELS: Record<number, string> = {
  1: 'Muito mal',
  2: 'Mal',
  3: 'Normal',
  4: 'Bem',
  5: 'Muito bem',
};
