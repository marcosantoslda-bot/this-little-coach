import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme';

export const ONBOARDING_STEPS = 4;

export interface OnboardingStepProps {
  step: number;
  title: string;
  subtitle?: string;
  back?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onNext: () => void;
  children: ReactNode;
}

export function OnboardingStep({
  step,
  title,
  subtitle,
  back = true,
  nextLabel = 'Continuar',
  nextDisabled,
  loading,
  onNext,
  children,
}: OnboardingStepProps) {
  return (
    <Screen back={back} footer={<Button title={nextLabel} onPress={onNext} disabled={nextDisabled} loading={loading} />}>
      <View style={styles.progress}>
        <Text variant="label">
          Passo {step} de {ONBOARDING_STEPS}
        </Text>
        <ProgressBar value={step / ONBOARDING_STEPS} />
      </View>
      <Text variant="big">{title}</Text>
      {subtitle ? (
        <Text variant="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.sm, marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  body: { marginTop: spacing.lg },
});
