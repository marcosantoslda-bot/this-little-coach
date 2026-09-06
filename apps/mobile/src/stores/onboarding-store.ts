/** Rascunho do onboarding entre os 4 ecrãs (não persistido de propósito). */
import type { Equipment, FitnessGoal, FitnessLevel } from '@tlc/shared';
import { create } from 'zustand';

interface OnboardingDraft {
  goal: FitnessGoal | null;
  fitnessLevel: FitnessLevel | null;
  availableEquipment: Equipment[];
  preferredSessionMinutes: number;
  trainingDaysPerWeek: number;

  setGoal: (goal: FitnessGoal) => void;
  setLevel: (level: FitnessLevel) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setMinutes: (minutes: number) => void;
  setDays: (days: number) => void;
  reset: () => void;
}

const initial = {
  goal: null,
  fitnessLevel: null,
  availableEquipment: ['NONE'] as Equipment[],
  preferredSessionMinutes: 30,
  trainingDaysPerWeek: 3,
};

export const useOnboardingStore = create<OnboardingDraft>()((set) => ({
  ...initial,
  setGoal: (goal) => set({ goal }),
  setLevel: (fitnessLevel) => set({ fitnessLevel }),
  setEquipment: (availableEquipment) => set({ availableEquipment }),
  setMinutes: (preferredSessionMinutes) => set({ preferredSessionMinutes }),
  setDays: (trainingDaysPerWeek) => set({ trainingDaysPerWeek }),
  reset: () => set(initial),
}));
