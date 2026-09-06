import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_BASE, conditionsRequiringClearance, findAgeBand } from './index';

describe('base de conhecimento', () => {
  it('tem os blocos esperados', () => {
    expect(Object.keys(KNOWLEDGE_BASE.goals)).toHaveLength(10);
    expect(Object.keys(KNOWLEDGE_BASE.muscle_focus)).toHaveLength(11);
    expect(Object.keys(KNOWLEDGE_BASE.age_bands)).toHaveLength(5);
    expect(Object.keys(KNOWLEDGE_BASE.conditions).length).toBeGreaterThanOrEqual(30);
    expect(KNOWLEDGE_BASE.disclaimer_pt.length).toBeGreaterThan(20);
  });

  it('as faixas etárias cobrem dos 6 aos 100 anos sem buracos', () => {
    for (const age of [6, 12, 13, 17, 18, 39, 40, 64, 65, 100]) {
      expect(findAgeBand(age), `idade ${age}`).not.toBeNull();
    }
  });

  it('identifica condições que exigem autorização médica', () => {
    const ids = Object.keys(KNOWLEDGE_BASE.conditions) as Array<keyof typeof KNOWLEDGE_BASE.conditions>;
    const clearance = conditionsRequiringClearance(ids);
    expect(clearance.length).toBeGreaterThan(0);
    expect(clearance).toContain('stable_heart_disease');
  });

  it('não contém emoji nem texto vazio nas etiquetas', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const group of [KNOWLEDGE_BASE.goals, KNOWLEDGE_BASE.muscle_focus, KNOWLEDGE_BASE.conditions]) {
      for (const entry of Object.values(group) as Array<{ label: string }>) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
        expect(emoji.test(entry.label)).toBe(false);
      }
    }
  });
});
