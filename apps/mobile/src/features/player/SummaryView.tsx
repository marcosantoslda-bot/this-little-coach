import type { Session } from '@tlc/shared';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Row, SectionTitle, StatRow, Text } from '@/components/ui';
import { secondsToMinutes } from '@/lib/format';
import { spacing } from '@/theme';

export function SummaryView({ session, onClose }: { session: Session; onClose: () => void }) {
  const sets = session.sets.filter((s) => !s.skipped).length;
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="label">Treino concluído</Text>
        <Text variant="title">{session.workout.name}</Text>
        <Text variant="display">{secondsToMinutes(session.durationSec)} min</Text>

        <View style={styles.stats}>
          <StatRow label="Séries" value={String(sets)} />
          <StatRow label="Calorias estimadas" value={session.estimatedCalories != null ? `${session.estimatedCalories} kcal` : '—'} />
          <StatRow label="RPE" value={session.rpe != null ? String(session.rpe) : '—'} last />
        </View>

        <SectionTitle>Recordes</SectionTitle>
        {session.newRecords.length === 0 ? (
          <Text variant="secondary">Sem recordes novos desta vez.</Text>
        ) : (
          session.newRecords.map((r, i) => (
            <Row key={`${r.exerciseId}-${r.metric}`} title={r.exerciseName} value={String(r.value)} last={i === session.newRecords.length - 1} />
          ))
        )}
      </ScrollView>
      <View style={styles.bottom}>
        <Button title="Voltar a Hoje" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.xs },
  stats: { marginTop: spacing.md },
  bottom: { paddingBottom: spacing.sm },
});
