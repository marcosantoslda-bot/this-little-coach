import { BLOCK_TYPE_LABELS, SET_ADJUSTMENT_REASON_LABELS, WORKOUT_FOCUS_LABELS, type Session, type SessionSet } from '@tlc/shared';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErrorState, Loading, Screen, SectionTitle, StatRow, Text } from '@/components/ui';
import { formatDateTime, secondsToMinutes } from '@/lib/format';
import { MOOD_LABELS } from '@/lib/labels';
import { useExercisesByIds } from '@/lib/queries/exercises';
import { useSession } from '@/lib/queries/sessions';
import { hairline, spacing, useTheme } from '@/theme';

const STATUS_LABELS: Record<Session['status'], string> = {
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluído',
  ABANDONED: 'Abandonado',
};

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(id);

  if (session.isPending) {
    return (
      <Screen back>
        <Loading />
      </Screen>
    );
  }
  if (session.isError) {
    return (
      <Screen back>
        <ErrorState error={session.error} onRetry={() => void session.refetch()} />
      </Screen>
    );
  }
  return <Detail session={session.data} />;
}

function Detail({ session }: { session: Session }) {
  const t = useTheme();

  // Nomes dos exercícios: do snapshot; os substituídos vêm de GET /exercises/:id.
  const snapshotNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of session.workout.blocks) for (const we of b.exercises) map.set(we.exercise.id, we.exercise.name);
    return map;
  }, [session.workout.blocks]);
  const missingIds = useMemo(
    () => [...new Set(session.sets.map((s) => s.exerciseId).filter((eid) => !snapshotNames.has(eid)))],
    [session.sets, snapshotNames],
  );
  const fetched = useExercisesByIds(missingIds);
  const nameOf = (eid: string) => snapshotNames.get(eid) ?? fetched.exercises.find((e) => e.id === eid)?.name ?? 'Exercício';

  const blockTypeByOrder = new Map(session.workout.blocks.map((b) => [b.order, b.type] as const));
  const groups = groupByBlock(session.sets);
  const setsDone = session.sets.filter((s) => !s.skipped).length;

  return (
    <Screen back>
      <Text variant="label">{STATUS_LABELS[session.status]}</Text>
      <Text variant="title">{session.workout.name}</Text>
      <Text variant="secondary">
        {formatDateTime(session.startedAt)} · {WORKOUT_FOCUS_LABELS[session.workout.focus]}
      </Text>
      <View style={styles.hero}>
        <Text variant="display">{secondsToMinutes(session.durationSec)} min</Text>
      </View>

      <StatRow label="Séries" value={String(setsDone)} />
      <StatRow label="RPE" value={session.rpe != null ? String(session.rpe) : '—'} />
      <StatRow label="Humor no fim" value={session.moodAfter != null ? (MOOD_LABELS[session.moodAfter] ?? String(session.moodAfter)) : '—'} />
      <StatRow label="Avaliação" value={session.rating != null ? `${session.rating} de 5` : '—'} />
      <StatRow label="Calorias estimadas" value={session.estimatedCalories != null ? `${session.estimatedCalories} kcal` : '—'} last />
      {session.notes ? (
        <>
          <SectionTitle>Notas</SectionTitle>
          <Text>{session.notes}</Text>
        </>
      ) : null}

      {session.newRecords.length > 0 ? (
        <>
          <SectionTitle>Recordes nesta sessão</SectionTitle>
          {session.newRecords.map((r) => (
            <StatRow key={`${r.exerciseId}-${r.metric}`} label={r.exerciseName} value={String(r.value)} />
          ))}
        </>
      ) : null}

      {groups.map(({ blockOrder, sets }) => (
        <View key={blockOrder}>
          <SectionTitle>{BLOCK_TYPE_LABELS[blockTypeByOrder.get(blockOrder) ?? 'MAIN']}</SectionTitle>
          {sets.map((s, i) => (
            <View key={s.id} style={[styles.setRow, { borderBottomColor: t.border, borderBottomWidth: i === sets.length - 1 ? 0 : hairline }]}>
              <View style={styles.setLeft}>
                <Text numberOfLines={2}>{nameOf(s.exerciseId)}</Text>
                <Text variant="caption">
                  {`Ronda ${s.round}`}
                  {s.substitutedFromId ? ' · substituído' : ''}
                  {s.adjustmentReason !== 'NONE' ? ` · ${SET_ADJUSTMENT_REASON_LABELS[s.adjustmentReason]}` : ''}
                </Text>
              </View>
              <Text variant="bodyStrong">{describeSet(s)}</Text>
            </View>
          ))}
        </View>
      ))}
      {session.sets.length === 0 ? <Text variant="secondary" style={styles.empty}>Sem séries registadas.</Text> : null}
    </Screen>
  );
}

function describeSet(s: SessionSet): string {
  if (s.skipped) return 'Saltada';
  if (s.durationSec != null && s.targetDurationSec != null) return `${s.durationSec} s`;
  if (s.repsCompleted != null) return s.targetReps != null ? `${s.repsCompleted} / ${s.targetReps}` : `${s.repsCompleted} reps`;
  if (s.durationSec != null) return `${s.durationSec} s`;
  return '—';
}

function groupByBlock(sets: SessionSet[]): { blockOrder: number; sets: SessionSet[] }[] {
  const map = new Map<number, SessionSet[]>();
  for (const s of [...sets].sort((a, b) => a.blockOrder - b.blockOrder || a.order - b.order || a.round - b.round)) {
    const list = map.get(s.blockOrder) ?? [];
    list.push(s);
    map.set(s.blockOrder, list);
  }
  return [...map.entries()].map(([blockOrder, list]) => ({ blockOrder, sets: list }));
}

const styles = StyleSheet.create({
  hero: { marginTop: spacing.sm, marginBottom: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: spacing.md },
  setLeft: { flex: 1, gap: 2 },
  empty: { marginTop: spacing.lg },
});
