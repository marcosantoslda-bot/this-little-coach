import { FITNESS_LEVEL_LABELS, FITNESS_LEVELS, type FitnessLevel } from '@tlc/shared';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { OptionList } from '@/features/onboarding/OptionList';
import { useOnboardingStore } from '@/stores/onboarding-store';

const DESCRIPTIONS: Record<FitnessLevel, string> = {
  BEGINNER: 'Pouca ou nenhuma rotina de treino',
  INTERMEDIATE: 'Treinas há alguns meses com regularidade',
  ADVANCED: 'Treinas há anos e conheces bem o teu corpo',
  ATHLETE: 'Treinas para competir ou com alto volume',
};

export default function LevelStep() {
  const router = useRouter();
  const level = useOnboardingStore((s) => s.fitnessLevel);
  const setLevel = useOnboardingStore((s) => s.setLevel);
  return (
    <OnboardingStep step={2} title="Qual é o teu nível?" nextDisabled={!level} onNext={() => router.push('/(onboarding)/equipment')}>
      <OptionList
        options={FITNESS_LEVELS.map((l) => ({ value: l, label: FITNESS_LEVEL_LABELS[l], description: DESCRIPTIONS[l] }))}
        value={level}
        onChange={setLevel}
      />
    </OnboardingStep>
  );
}
