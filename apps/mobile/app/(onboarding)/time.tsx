import { completeOnboardingSchema } from '@tlc/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionTitle, Stepper, Text } from '@/components/ui';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { errorMessage } from '@/lib/api';
import { useCompleteOnboarding } from '@/lib/queries/me';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { spacing } from '@/theme';

export default function TimeStep() {
  const draft = useOnboardingStore();
  const complete = useCompleteOnboarding();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const parsed = completeOnboardingSchema.safeParse({
      goal: draft.goal,
      fitnessLevel: draft.fitnessLevel,
      availableEquipment: draft.availableEquipment,
      preferredSessionMinutes: draft.preferredSessionMinutes,
      trainingDaysPerWeek: draft.trainingDaysPerWeek,
    });
    if (!parsed.success) {
      setError('Faltam respostas nos passos anteriores.');
      return;
    }
    complete.mutate(parsed.data, {
      onSuccess: () => draft.reset(),
      onError: (e) => setError(errorMessage(e)),
    });
  }

  return (
    <OnboardingStep step={4} title="Quanto tempo tens?" nextLabel="Concluir" loading={complete.isPending} onNext={submit}>
      <SectionTitle top={0}>Minutos por treino</SectionTitle>
      <Stepper big value={draft.preferredSessionMinutes} min={10} max={90} step={5} onChange={draft.setMinutes} format={(v) => `${v} min`} />

      <SectionTitle>Dias por semana</SectionTitle>
      <Stepper big value={draft.trainingDaysPerWeek} min={1} max={7} onChange={draft.setDays} format={(v) => (v === 1 ? '1 dia' : `${v} dias`)} />

      {error ? (
        <View style={styles.error}>
          <Text>{error}</Text>
        </View>
      ) : null}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: spacing.lg },
});
