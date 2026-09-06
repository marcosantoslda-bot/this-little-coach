import { Ionicons } from '@expo/vector-icons';
import type { Exercise, Session, SessionSet } from '@tlc/shared';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ConfirmSheet, ErrorState, Loading, ProgressBar, Sheet, Text } from '@/components/ui';
import { ExerciseStepView, type SetResult } from '@/features/player/ExerciseStepView';
import { FinishForm, type FinishValues } from '@/features/player/FinishForm';
import { tap } from '@/features/player/haptics';
import { RestStepView } from '@/features/player/RestStepView';
import { buildSteps, countExerciseSteps, exerciseOrder, type Step } from '@/features/player/steps';
import { SummaryView } from '@/features/player/SummaryView';
import { SwapSheet } from '@/features/player/SwapSheet';
import { errorMessage } from '@/lib/api';
import { useAbandonSession, useCompleteSession, useSession } from '@/lib/queries/sessions';
import { flushWithRetry, useSessionStore } from '@/stores/session-store';
import { spacing, useTheme } from '@/theme';

type Phase = 'play' | 'finish' | 'summary';

export default function SessionPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);

  if (session.isPending) {
    return (
      <PlayerFrame>
        <Loading label="A preparar o treino" />
      </PlayerFrame>
    );
  }
  if (session.isError) {
    return (
      <PlayerFrame>
        <ErrorState error={session.error} onRetry={() => void session.refetch()} />
      </PlayerFrame>
    );
  }
  return <Player session={session.data} />;
}

function Player({ session }: { session: Session }) {
  const router = useRouter();
  const t = useTheme();
  const store = useSessionStore();
  const complete = useCompleteSession();
  const abandon = useAbandonSession();

  const steps = useMemo(() => buildSteps(session.workout.blocks), [session.workout.blocks]);
  const totalSets = useMemo(() => countExerciseSteps(steps), [steps]);
  const isActive = store.active?.id === session.id;

  // Retoma na posição guardada; se a sessão não é a ativa (link antigo), começa do zero.
  const [localIndex, setLocalIndex] = useState(0);
  const stepIndex = isActive ? (store.active?.position.stepIndex ?? 0) : localIndex;
  const setStepIndex = (i: number) => {
    if (isActive) store.setPosition({ stepIndex: i });
    else setLocalIndex(i);
  };

  const [phase, setPhase] = useState<Phase>(() => (session.status === 'COMPLETED' ? 'summary' : 'play'));
  const [showSwap, setShowSwap] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Session | null>(session.status === 'COMPLETED' ? session : null);

  // Sessões já fechadas noutro lado: limpa o estado local.
  useEffect(() => {
    if (session.status !== 'IN_PROGRESS' && isActive) store.clearActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  // Volta a tentar sincronizar séries pendentes quando a app regressa ao primeiro plano.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && store.pendingFor(session.id).length > 0) void flushWithRetry(session.id, 1);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const step: Step | undefined = steps[stepIndex];
  const pending = store.pendingFor(session.id);
  const setsDone = exerciseOrder(steps, stepIndex);

  function effectiveExercise(weId: string, fallback: Exercise): Exercise {
    return (isActive ? store.active?.substitutions[weId] : undefined) ?? fallback;
  }

  function advance() {
    const next = stepIndex + 1;
    if (next >= steps.length) setPhase('finish');
    else setStepIndex(next);
  }

  function onSetDone(result: SetResult) {
    if (!step || step.kind !== 'exercise') return;
    void tap();
    const exercise = effectiveExercise(step.we.id, step.we.exercise);
    const substituted = exercise.id !== step.we.exercise.id;
    const set: SessionSet = {
      id: Crypto.randomUUID(),
      exerciseId: exercise.id,
      workoutExerciseId: step.we.id,
      blockOrder: step.blockOrder,
      round: step.round,
      order: exerciseOrder(steps, stepIndex),
      targetReps: step.we.targetReps,
      targetDurationSec: step.we.targetDurationSec,
      repsCompleted: result.repsCompleted,
      durationSec: result.durationSec,
      distanceM: null,
      loadKg: step.we.targetLoadKg,
      rpe: null,
      skipped: result.skipped,
      adjustmentReason: result.reason,
      substitutedFromId: substituted ? step.we.exercise.id : null,
      completedAt: new Date().toISOString(),
    };
    store.enqueueSet(session.id, set);
    void flushWithRetry(session.id);
    advance();
  }

  function durationSec(): number {
    const started = new Date(session.startedAt).getTime();
    return Math.max(0, Math.min(4 * 3600, Math.round((Date.now() - started) / 1000)));
  }

  function save(values: FinishValues) {
    setError(null);
    const unsynced = store.pendingFor(session.id);
    complete.mutate(
      {
        id: session.id,
        input: {
          durationSec: durationSec(),
          rpe: values.rpe,
          moodAfter: values.moodAfter,
          rating: values.rating,
          notes: values.notes,
          completedAt: new Date().toISOString(),
          sets: unsynced.length > 0 ? unsynced : undefined,
        },
      },
      {
        onSuccess: (completed) => {
          store.discardQueue(session.id);
          if (isActive) store.clearActive();
          setSummary(completed);
          setPhase('summary');
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  function doAbandon() {
    abandon.mutate(session.id, {
      onSettled: () => {
        store.discardQueue(session.id);
        if (isActive) store.clearActive();
        setConfirmAbandon(false);
        router.replace('/(tabs)');
      },
    });
  }

  function close() {
    router.replace('/(tabs)');
  }

  if (phase === 'summary' && summary) {
    return (
      <PlayerFrame>
        <SummaryView session={summary} onClose={close} />
      </PlayerFrame>
    );
  }

  if (phase === 'finish' || !step) {
    return (
      <PlayerFrame>
        <FinishForm
          durationSec={durationSec()}
          setsDone={setsDone}
          pendingSync={pending.length}
          loading={complete.isPending}
          error={error}
          onSave={save}
          onAbandon={() => setConfirmAbandon(true)}
        />
        <ConfirmSheet
          visible={confirmAbandon}
          title="Terminar sem guardar?"
          message="A sessão fica marcada como abandonada e as séries não contam para o progresso."
          confirmLabel="Terminar sem guardar"
          onConfirm={doAbandon}
          onCancel={() => setConfirmAbandon(false)}
          loading={abandon.isPending}
        />
      </PlayerFrame>
    );
  }

  const exercise = step.kind === 'exercise' ? effectiveExercise(step.we.id, step.we.exercise) : null;

  return (
    <PlayerFrame>
      <View style={styles.top}>
        <View style={styles.progress}>
          <ProgressBar value={totalSets === 0 ? 0 : setsDone / totalSets} />
        </View>
        <Text variant="caption">
          {setsDone}/{totalSets}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Terminar" hitSlop={12} onPress={() => setShowExit(true)}>
          <Ionicons name="close" size={26} color={t.text} />
        </Pressable>
      </View>

      {step.kind === 'exercise' && exercise ? (
        <ExerciseStepView key={step.key} step={step} exercise={exercise} onDone={onSetDone} onSwap={() => setShowSwap(true)} />
      ) : step.kind === 'rest' ? (
        <RestStepView key={step.key} step={step} onDone={advance} />
      ) : null}

      {pending.length > 0 && store.lastFlushError ? (
        <Text variant="caption" align="center" style={styles.sync}>
          {pending.length} séries por sincronizar
        </Text>
      ) : null}

      {step.kind === 'exercise' && exercise ? (
        <SwapSheet
          visible={showSwap}
          exercise={exercise}
          onClose={() => setShowSwap(false)}
          onSelect={(e) => {
            if (isActive) store.substitute(step.we.id, e);
            setShowSwap(false);
          }}
        />
      ) : null}

      <Sheet visible={showExit} onClose={() => setShowExit(false)} title="Terminar treino">
        <View style={styles.exitActions}>
          <Button
            title="Guardar e terminar"
            variant="secondary"
            onPress={() => {
              setShowExit(false);
              setPhase('finish');
            }}
          />
          <Button
            title="Terminar sem guardar"
            variant="ghost"
            onPress={() => {
              setShowExit(false);
              setConfirmAbandon(true);
            }}
          />
          <Button title="Continuar" variant="ghost" onPress={() => setShowExit(false)} />
        </View>
      </Sheet>
      <ConfirmSheet
        visible={confirmAbandon}
        title="Terminar sem guardar?"
        message="A sessão fica marcada como abandonada e as séries não contam para o progresso."
        confirmLabel="Terminar sem guardar"
        onConfirm={doAbandon}
        onCancel={() => setConfirmAbandon(false)}
        loading={abandon.isPending}
      />
    </PlayerFrame>
  );
}

/** Ecrã inteiro, sem tabs, com safe area. */
function PlayerFrame({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.frame, { backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, paddingHorizontal: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  progress: { flex: 1 },
  sync: { paddingBottom: spacing.xs },
  exitActions: { gap: spacing.sm, paddingBottom: spacing.md },
});
