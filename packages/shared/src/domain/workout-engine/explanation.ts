/**
 * "Treino explicável": 3–5 frases curtas em pt-PT a justificar as escolhas.
 */
import type { Equipment, TrainingMode, WorkoutFocus } from '../../constants/enums';
import { EQUIPMENT_LABELS, TRAINING_MODE_LABELS, WORKOUT_FORMAT_LABELS } from '../../constants/labels.pt';
import { isLowEnergy, isReducedMode } from './difficulty';
import { WORKOUT_NAME_BY_FOCUS } from './focus';
import type { ExerciseSwap } from './selection';
import type { GeneratedBlock } from './types';

export interface ExplanationInput {
  availableMinutes: number;
  energyLevel: number;
  mode: TrainingMode;
  focus: WorkoutFocus;
  requiredEquipment: readonly Equipment[];
  mainBlock: GeneratedBlock;
  hasFinisher: boolean;
  swaps: readonly ExerciseSwap[];
}

const FOCUS_REASON: Record<WorkoutFocus, string> = {
  FULL_BODY: 'equilibrei agachar, empurrar, dobradiça de anca, puxar e core',
  UPPER_BODY: 'dei prioridade a empurrar, puxar e core',
  LOWER_BODY: 'dei prioridade a agachamentos, dobradiça de anca e glúteos',
  PUSH: 'concentrei-me nos padrões de empurrar',
  PULL: 'concentrei-me nos padrões de puxar',
  LEGS: 'dei prioridade a agachamentos e dobradiça de anca',
  CORE: 'concentrei-me em estabilidade e rotação do tronco',
  CARDIO: 'alternei locomoção e saltos com pernas e core',
  MOBILITY: 'escolhi movimentos de mobilidade e alongamento',
};

/** Descrição da estrutura do bloco principal, com o artigo certo para cada formato. */
function describeStructure(block: GeneratedBlock): string {
  const count = block.exercises.length;
  switch (block.format) {
    case 'AMRAP':
      return `um AMRAP de ${count} exercícios`;
    case 'STRAIGHT_SETS':
      return `${count} exercícios em ${block.rounds} séries`;
    default:
      return `um ${WORKOUT_FORMAT_LABELS[block.format].toLowerCase()} de ${count} exercícios em ${block.rounds} voltas`;
  }
}

function timeSentence(input: ExplanationInput): string {
  const finisher = input.hasFinisher ? ', com finisher' : '';
  return `Tens ${input.availableMinutes} minutos, por isso montei ${describeStructure(input.mainBlock)}${finisher}.`;
}

function energyAndModeSentence(input: ExplanationInput): string {
  const { energyLevel, mode } = input;
  if (isReducedMode(mode)) {
    return `Estás em modo ${TRAINING_MODE_LABELS[mode].toLowerCase()}, por isso baixei a dificuldade e o volume e deixei o finisher de fora.`;
  }
  if (mode === 'VACATION') {
    return 'Em modo férias encurtei o treino para manteres o hábito sem perderes o descanso.';
  }
  if (isLowEnergy(energyLevel)) return 'Como a tua energia está baixa, baixei a dificuldade e reduzi os alvos em 20%.';
  if (energyLevel >= 5) return 'Estás cheio de energia, por isso subi a dificuldade um nível.';
  if (energyLevel === 4) return 'Com boa energia, escolhi variantes mais exigentes quando as havia.';
  return 'Energia normal: mantive a dificuldade do teu nível.';
}

function equipmentSentence(equipment: readonly Equipment[]): string {
  const used = equipment.filter((e) => e !== 'NONE');
  if (used.length === 0) return 'Só com o peso do corpo — não precisas de equipamento.';
  return `Usei o equipamento que tens à mão: ${used.map((e) => EQUIPMENT_LABELS[e].toLowerCase()).join(', ')}.`;
}

function focusSentence(focus: WorkoutFocus): string {
  return `Foco em ${WORKOUT_NAME_BY_FOCUS[focus].toLowerCase()}: ${FOCUS_REASON[focus]}.`;
}

function swapsSentence(swaps: readonly ExerciseSwap[]): string | null {
  if (swaps.length === 0) return null;
  const parts = swaps.slice(0, 2).map((s) => `${s.from.name} por ${s.to.name} (${s.direction === 'easier' ? 'mais fácil' : 'mais difícil'})`);
  const suffix = swaps.length > 2 ? ` e mais ${swaps.length - 2}` : '';
  return `Troquei ${parts.join(' e ')}${suffix} para ficar ao teu nível.`;
}

/** Devolve 4–5 frases: tempo, energia/modo, equipamento, foco e (se houver) trocas. */
export function buildExplanation(input: ExplanationInput): string[] {
  const sentences = [timeSentence(input), energyAndModeSentence(input), equipmentSentence(input.requiredEquipment), focusSentence(input.focus)];
  const swaps = swapsSentence(input.swaps);
  if (swaps != null) sentences.push(swaps);
  return sentences;
}
