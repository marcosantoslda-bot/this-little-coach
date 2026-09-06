/**
 * Base de conhecimento do coach (gerada a partir de docs/KNOWLEDGE.md, Parte 2).
 * Fonte da verdade para a versão com servidor. A PWA embebe a mesma estrutura.
 * Ordem de aplicação: faixa etária → rastreio → condições → objetivo → foco muscular → equipamento.
 * Em conflito, ganha a regra mais restritiva.
 */
import kb from './knowledge-base.json';

export type KnowledgeBase = typeof kb;
export type GoalId = keyof KnowledgeBase['goals'];
export type MuscleFocusId = keyof KnowledgeBase['muscle_focus'];
export type ConditionId = keyof KnowledgeBase['conditions'];
export type AgeBandId = keyof KnowledgeBase['age_bands'];

export const KNOWLEDGE_BASE: KnowledgeBase = kb;

export function findAgeBand(ageYears: number): KnowledgeBase['age_bands'][AgeBandId] | null {
  const bands = Object.values(KNOWLEDGE_BASE.age_bands) as Array<{ min: number; max: number }>;
  const band = bands.find((b) => ageYears >= b.min && ageYears <= b.max);
  return (band as KnowledgeBase['age_bands'][AgeBandId]) ?? null;
}

export function conditionsRequiringClearance(ids: ConditionId[]): ConditionId[] {
  return ids.filter((id) => KNOWLEDGE_BASE.conditions[id]?.requires_clearance === true);
}
