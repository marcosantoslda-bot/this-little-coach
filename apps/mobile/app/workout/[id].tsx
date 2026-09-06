import {
  BLOCK_TYPE_LABELS,
  EQUIPMENT_LABELS,
  WORKOUT_FOCUS_LABELS,
  WORKOUT_FORMAT_LABELS,
  type WorkoutBlock,
} from '@tlc/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ConfirmSheet, ErrorState, Loading, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { difficultyDots, formatTarget } from '@/lib/format';
import { useAbandonSession, useStartSession } from '@/lib/queries/sessions';
import { useDeleteWorkout, useWorkout } from '@/lib/queries/workouts';
import { useSessionStore } from '@/stores/session-store';
import { spacing } from '@/theme';

export default function WorkoutPreviewScreen() {
  const router = useRouter();
  const { id, energy } = useLocalSearchParams<{ id: string; energy?: string }>();
  const workout = useWorkout(id);
  const start = useStartSession();
  const abandon = useAbandonSession();
  const remove = useDeleteWorkout();
  const active = useSessionStore((s) => s.active);
  const startActive = useSessionStore((s) => s.startActive);
  const discardQueue = useSessionStore((s) => s.discardQueue);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const energyBefore = energy ? Math.min(5, Math.max(1, Number(energy) || 3)) : null;

  function startSession() {
    if (!workout.data) return;
    setError(null);
    const w = workout.data;
    start.mutate(
      { workoutId: w.id, energyBefore, startedAt: new Date().toISOString() },
      {
        onSuccess: (session) => {
          startActive({ id: session.id, workoutName: w.name, startedAt: session.startedAt });
          router.replace({ pathname: '/session/[id]', params: { id: session.id } });
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  function onStartPress() {
    if (active && active.id) setConfirmReplace(true);
    else startSession();
  }

  function replaceActive() {
    if (!active) return;
    const oldId = active.id;
    abandon.mutate(oldId, {
      onSettled: () => {
        discardQueue(oldId);
        setConfirmReplace(false);
        startSession();
      },
    });
  }

  function deleteWorkout() {
    if (!id) return;
    remove.mutate(id, {
      onSettled: () => {
        setConfirmDelete(false);
        router.back();
      },
    });
  }

  if (workout.isPending) {
    return (
      <Screen back>
        <Loading />
      </Screen>
    );
  }
  if (workout.isError) {
    return (
      <Screen back>
        <ErrorState error={workout.error} onRetry={() => void workout.refetch()} />
      </Screen>
    );
  }

  const w = workout.data;

  return (
    <Screen
      back
      footer={
        <View style={styles.footer}>
          <Button title="Começar" onPress={onStartPress} loading={start.isPending} />
          {w.source !== 'SYSTEM' ? <Button title="Apagar treino" variant="ghost" onPress={() => setConfirmDelete(true)} /> : null}
        </View>
      }
    >
      <Text variant="title">{w.name}</Text>
      <View style={styles.hero}>
        <Text variant="display">{w.estimatedDurationMin} min</Text>
        <Text variant="secondary">
          {WORKOUT_FOCUS_LABELS[w.focus]} · {difficultyDots(w.difficulty)}
        </Text>
      </View>
      {w.description ? <Text variant="secondary">{w.description}</Text> : null}

      <SectionTitle>Equipamento</SectionTitle>
      <Text>{w.requiredEquipment.length ? w.requiredEquipment.map((e) => EQUIPMENT_LABELS[e]).join(', ') : EQUIPMENT_LABELS.NONE}</Text>

      {w.explanation.length > 0 ? (
        <>
          <SectionTitle>Porquê este treino</SectionTitle>
          {w.explanation.map((line, i) => (
            <Text key={i} variant="secondary" style={styles.explanation}>
              — {line}
            </Text>
          ))}
        </>
      ) : null}

      {w.blocks.map((block) => (
        <BlockSection key={block.id} block={block} />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ConfirmSheet
        visible={confirmReplace}
        title="Tens um treino em curso"
        message="Começar este treino descarta o que está em curso."
        confirmLabel="Descartar e começar"
        onConfirm={replaceActive}
        onCancel={() => setConfirmReplace(false)}
        loading={abandon.isPending}
      />
      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar este treino?"
        message="As sessões já realizadas mantêm-se no histórico."
        confirmLabel="Apagar"
        onConfirm={deleteWorkout}
        onCancel={() => setConfirmDelete(false)}
        loading={remove.isPending}
      />
    </Screen>
  );
}

function BlockSection({ block }: { block: WorkoutBlock }) {
  const parts = [BLOCK_TYPE_LABELS[block.type], WORKOUT_FORMAT_LABELS[block.format]];
  if (block.rounds > 1) parts.push(`${block.rounds} rondas`);
  return (
    <View>
      <SectionTitle>{parts.join(' · ')}</SectionTitle>
      {block.name ? <Text variant="secondary" style={styles.blockName}>{block.name}</Text> : null}
      {block.exercises.map((we, i) => (
        <Row
          key={we.id}
          title={we.exercise.name}
          subtitle={we.exercise.isUnilateral ? 'Cada lado' : undefined}
          value={formatTarget(we)}
          last={i === block.exercises.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: spacing.sm, marginBottom: spacing.sm },
  explanation: { marginBottom: spacing.xs },
  blockName: { marginBottom: spacing.xs },
  error: { marginTop: spacing.md },
  footer: { gap: spacing.xs },
});
