import { FITNESS_GOAL_LABELS, FITNESS_GOALS } from '@tlc/shared';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { OptionList } from '@/features/onboarding/OptionList';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function GoalStep() {
  const router = useRouter();
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  return (
    <OnboardingStep
      step={1}
      back={false}
      title="Qual é o teu objetivo?"
      subtitle="Podes mudar mais tarde nas definições."
      nextDisabled={!goal}
      onNext={() => router.push('/(onboarding)/level')}
    >
      <OptionList
        options={FITNESS_GOALS.map((g) => ({ value: g, label: FITNESS_GOAL_LABELS[g] }))}
        value={goal}
        onChange={setGoal}
      />
    </OnboardingStep>
  );
}
