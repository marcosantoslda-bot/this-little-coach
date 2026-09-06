import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TimerDisplay, useTimer } from '@/components/ui';
import { spacing } from '@/theme';
import { success } from './haptics';
import type { RestStep } from './steps';

export function RestStepView({ step, onDone }: { step: RestStep; onDone: () => void }) {
  const timer = useTimer({
    mode: 'countdown',
    seconds: step.seconds,
    autoStart: true,
    onFinish: () => {
      void success();
      onDone();
    },
  });

  useEffect(() => {
    timer.reset(step.seconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.key]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text variant="label">Descanso</Text>
        {step.nextName ? <Text variant="secondary">A seguir: {step.nextName}</Text> : null}
      </View>
      <View style={styles.center}>
        <TimerDisplay seconds={timer.display} caption={`de ${step.seconds} s`} />
      </View>
      <View style={styles.bottom}>
        <Button title="Saltar descanso" onPress={onDone} />
        <Button title={timer.running ? 'Pausa' : 'Retomar'} variant="ghost" onPress={timer.toggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottom: { gap: spacing.xs, paddingBottom: spacing.sm },
});
