/**
 * Etiquetas em português (pt-PT) para os enums. Usadas pela app mobile e pela API
 * (mensagens). Curtas e sem emoji, de propósito.
 */
import type {
  BlockType, Equipment, FitnessGoal, FitnessLevel, MovementPattern, MuscleGroup,
  SetAdjustmentReason, TrainingFocus, TrainingMode, WorkoutFocus, WorkoutFormat,
} from './enums';

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  LOSE_FAT: 'Perder gordura',
  GAIN_MUSCLE: 'Ganhar músculo',
  MAINTAIN: 'Manter',
  IMPROVE_ENDURANCE: 'Melhorar resistência',
  GENERAL_HEALTH: 'Saúde geral',
};

export const FITNESS_LEVEL_LABELS: Record<FitnessLevel, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermédio',
  ADVANCED: 'Avançado',
  ATHLETE: 'Atleta',
};

export const TRAINING_FOCUS_LABELS: Record<TrainingFocus, string> = {
  BALANCED: 'Equilibrado',
  LOWER_BODY_GLUTES: 'Pernas e glúteos',
  UPPER_BODY_ARMS: 'Tronco e braços',
  CORE: 'Core',
  CARDIO: 'Cardio',
};

export const TRAINING_MODE_LABELS: Record<TrainingMode, string> = {
  NORMAL: 'Normal',
  VACATION: 'Férias',
  PAUSED: 'Pausa',
  SICK: 'Doente',
  RECOVERING: 'Recuperação',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  NONE: 'Sem equipamento',
  MAT: 'Tapete',
  PULL_UP_BAR: 'Barra de elevações',
  RESISTANCE_BAND: 'Banda elástica',
  DUMBBELLS: 'Halteres',
  KETTLEBELL: 'Kettlebell',
  BARBELL: 'Barra',
  BENCH: 'Banco',
  CABLE_MACHINE: 'Cabo',
  MACHINE: 'Máquina',
  JUMP_ROPE: 'Corda de saltar',
  PLYO_BOX: 'Caixa',
  TREADMILL: 'Passadeira',
  BIKE: 'Bicicleta',
  ROWER: 'Remo',
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Peito',
  LATS: 'Dorsais',
  UPPER_BACK: 'Costas (superior)',
  LOWER_BACK: 'Lombar',
  SHOULDERS: 'Ombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  FOREARMS: 'Antebraços',
  CORE: 'Core',
  OBLIQUES: 'Oblíquos',
  GLUTES: 'Glúteos',
  QUADS: 'Quadríceps',
  HAMSTRINGS: 'Isquiotibiais',
  CALVES: 'Gémeos',
  HIP_FLEXORS: 'Flexores da anca',
  ADDUCTORS: 'Adutores',
  ABDUCTORS: 'Abdutores',
  FULL_BODY: 'Corpo inteiro',
  CARDIOVASCULAR: 'Cardio',
};

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  PUSH_HORIZONTAL: 'Empurrar (horizontal)',
  PUSH_VERTICAL: 'Empurrar (vertical)',
  PULL_HORIZONTAL: 'Puxar (horizontal)',
  PULL_VERTICAL: 'Puxar (vertical)',
  SQUAT: 'Agachar',
  HINGE: 'Dobradiça de anca',
  LUNGE: 'Afundo',
  CARRY: 'Transporte',
  ROTATION: 'Rotação',
  ANTI_ROTATION: 'Anti-rotação',
  LOCOMOTION: 'Locomoção',
  JUMP: 'Salto',
  ISOMETRIC: 'Isométrico',
};

export const WORKOUT_FOCUS_LABELS: Record<WorkoutFocus, string> = {
  FULL_BODY: 'Corpo inteiro',
  UPPER_BODY: 'Tronco',
  LOWER_BODY: 'Pernas',
  PUSH: 'Empurrar',
  PULL: 'Puxar',
  LEGS: 'Pernas',
  CORE: 'Core',
  CARDIO: 'Cardio',
  MOBILITY: 'Mobilidade',
};

export const WORKOUT_FORMAT_LABELS: Record<WorkoutFormat, string> = {
  STRAIGHT_SETS: 'Séries',
  SUPERSET: 'Superset',
  CIRCUIT: 'Circuito',
  AMRAP: 'AMRAP',
  EMOM: 'EMOM',
  FOR_TIME: 'Por tempo',
  TABATA: 'Tabata',
  INTERVAL: 'Intervalos',
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  WARMUP: 'Aquecimento',
  MAIN: 'Principal',
  FINISHER: 'Finisher',
  COOLDOWN: 'Retorno à calma',
};

export const SET_ADJUSTMENT_REASON_LABELS: Record<SetAdjustmentReason, string> = {
  NONE: 'Sem ajuste',
  TOO_HARD: 'Muito difícil',
  TOO_EASY: 'Muito fácil',
  PAIN: 'Dor',
  OUT_OF_TIME: 'Sem tempo',
  EQUIPMENT_MISSING: 'Sem equipamento',
  OTHER: 'Outro',
};
