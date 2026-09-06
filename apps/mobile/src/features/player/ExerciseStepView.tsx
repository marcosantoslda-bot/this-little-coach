import { BLOCK_TYPE_LABELS, type Exercise, type SetAdjustmentReason } from '@tlc/shared';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, SectionTitle, Stepper, Text, TimerDisplay, useTimer } from '@/components/ui';
import { formatTarget } from '@/lib/format';
import { hairline, radius, spacing, useTheme } from '@/theme';
import type { ExerciseStep } from './steps';

export interface SetResult {
  reason: SetAdjustmentReason;
  repsCompleted: number | null;
  durationSec: number | null;
  skipped: boolean;
}

export interface ExerciseStepViewProps {
  step: ExerciseStep;
  /** Exercício efetivo (pode ser substituto). */
  exercise: Exercise;
  onDone: (result: SetResult) => void;
  onSwap: () => void;
}

const FEEDBACK: { reason: SetAdjustmentReason; label: string }[] = [
  { reason: 'TOO_EASY', label: 'Fácil' },
  { reason: 'NONE', label: 'OK' },
  { reason: 'TOO_HARD', label: 'Difícil' },
  { reason: 'PAIN', label: 'Dor' },
];

/** Um exercício de cada vez: nome enorme, alvo enorme, temporizador e, no fim, feedback num toque. */
export function ExerciseStepView({ step, exercise, onDone, onSwap }: ExerciseStepViewProps) {
  const t = useTheme();
  const { we } = step;
  const isDuration = we.targetDurationSec != null;
  const target = we.targetDurationSec ?? 0;

  const [phase, setPhase] = useState<'work' | 'feedback'>('work');
  const [reps, setReps] = useState<number>(we.targetReps ?? 0);
  const [workSeconds, setWorkSeconds] = useState(0);

  const timer = useTimer({
    mode: isDuration ? 'countdown' : 'stopwatch',
    seconds: target,
    autoStart: !isDuration,
    onFinish: () => finishWork(target),
  });

  // Novo passo: recomeça tudo.
  useEffect(() => {
    setPhase('work');
    setReps(we.targetReps ?? 0);
    setWorkSeconds(0);
    timer.reset(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.key]);

  function finishWork(seconds: number) {
    timer.pause();
    setWorkSeconds(seconds);
    setPhase('feedback');
  }

  const roundLabel = step.format === 'STRAIGHT_SETS' ? 'Série' : 'Ronda';
  const header = (
    <View style={styles.header}>
      <Text variant="label">
        {BLOCK_TYPE_LABELS[step.blockType]}
        {step.rounds > 1 ? ` · ${roundLabel} ${step.round} de ${step.rounds}` : ''}
      </Text>
      <Text variant="big" numberOfLines={3}>
        {exercise.name}
      </Text>
      {exercise.isUnilateral ? <Text variant="secondary">Cada lado</Text> : null}
    </View>
  );

  if (phase === 'feedback') {
    return (
      <View style={styles.flex}>
        {header}
        <View style={styles.center}>
          {isDuration ? (
            <View style={styles.centerText}>
              <Text variant="display">{workSeconds} s</Text>
              <Text variant="secondary">de {formatTarget(we)}</Text>
            </View>
          ) : (
            <View style={styles.repsBlock}>
              <SectionTitle top={0}>Reps feitas</SectionTitle>
              <Stepper big value={reps} min={0} max={200} onChange={setReps} />
              {we.targetReps != null ? <Text variant="secondary" align="center">alvo {we.targetReps}</Text> : null}
            </View>
          )}
        </View>
        <View style={styles.bottom}>
          <Text variant="label" align="center">
            Como foi?
          </Text>
          <View style={styles.feedbackRow}>
            {FEEDBACK.map((f) => (
              <Pressable
                key={f.reason}
                accessibilityRole="button"
                onPress={() =>
                  onDone({
                    reason: f.reason,
                    repsCompleted: isDuration ? null : reps,
                    durationSec: isDuration ? workSeconds : timer.elapsed,
                    skipped: false,
                  })
                }
                style={({ pressed }) => [styles.feedbackBtn, { borderColor: t.text, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text variant="bodyStrong">{f.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {header}
      <View style={styles.center}>
        {isDuration ? (
          <TimerDisplay seconds={timer.display} caption={`de ${target} s`} />
        ) : (
          <View style={styles.centerText}>
            <Text variant="display">{formatTarget(we)}</Text>
            <Text variant="secondary">{`${Math.floor(timer.display / 60)}:${String(timer.display % 60).padStart(2, '0')}`}</Text>
          </View>
        )}
        {exercise.cues.length > 0 ? (
          <View style={styles.cues}>
            {exercise.cues.slice(0, 3).map((c, i) => (
              <Text key={i} variant="secondary" align="center">
                {c}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        {isDuration ? (
          <View style={styles.row}>
            <Button title={timer.running ? 'Pausa' : timer.elapsed > 0 ? 'Retomar' : 'Iniciar'} variant="secondary" onPress={timer.toggle} style={styles.grow} />
            <Button title="Feito" onPress={() => finishWork(Math.min(target, timer.elapsed))} style={styles.grow} />
          </View>
        ) : (
          <Button title="Feito" onPress={() => finishWork(timer.elapsed)} />
        )}
        <View style={styles.row}>
          <Button title="Trocar exercício" variant="ghost" compact onPress={onSwap} />
          <Button
            title="Saltar"
            variant="ghost"
            compact
            onPress={() => onDone({ reason: 'OTHER', repsCompleted: null, durationSec: null, skipped: true })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  centerText: { alignItems: 'center', gap: spacing.xs },
  cues: { gap: spacing.xs, paddingHorizontal: spacing.md },
  repsBlock: { alignSelf: 'stretch', gap: spacing.sm },
  bottom: { gap: spacing.sm, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  grow: { flex: 1 },
  feedbackRow: { flexDirection: 'row', gap: spacing.sm },
  feedbackBtn: {
    flex: 1,
    minHeight: 64,
    borderWidth: hairline,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
