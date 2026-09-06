import type { SessionSummary } from '@tlc/shared';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, Loading, Row, Screen, SectionTitle, SettingsButton, StatRow, Text } from '@/components/ui';
import { WeightChart } from '@/features/progress/WeightChart';
import { WeightInput } from '@/features/progress/WeightInput';
import { formatDateShort, formatDeltaKg, formatKg, formatRecordValue, secondsToMinutes } from '@/lib/format';
import { RECORD_METRIC_LABELS } from '@/lib/labels';
import { useProgressOverview } from '@/lib/queries/progress';
import { useSessions } from '@/lib/queries/sessions';
import { spacing } from '@/theme';

export default function ProgressScreen() {
  const router = useRouter();
  const overview = useProgressOverview();
  const history = useSessions({ status: 'COMPLETED' });
  const sessions = history.data?.pages.flatMap((p) => p.items) ?? [];

  const header = (
    <View>
      {overview.isPending ? (
        <Loading />
      ) : overview.isError ? (
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      ) : (
        <Overview data={overview.data} />
      )}
      <SectionTitle>Histórico</SectionTitle>
    </View>
  );

  return (
    <Screen title="Progresso" right={<SettingsButton />} scroll={false} contentStyle={styles.content}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <SessionRow
            session={item}
            last={index === sessions.length - 1}
            onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          history.isPending ? (
            <Loading />
          ) : history.isError ? (
            <ErrorState error={history.error} onRetry={() => void history.refetch()} />
          ) : (
            <EmptyState message="Os treinos concluídos aparecem aqui." />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage();
        }}
        ListFooterComponent={history.isFetchingNextPage ? <Loading /> : <View style={styles.footer} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

function Overview({ data }: { data: NonNullable<ReturnType<typeof useProgressOverview>['data']> }) {
  const { week } = data;
  return (
    <View>
      <View style={styles.hero}>
        <Text variant="display">{week.sessionsCompleted}</Text>
        <Text variant="secondary">
          de {week.sessionsTarget} treinos esta semana · {week.totalMinutes} min
        </Text>
      </View>
      <StatRow label="Sequência" value={data.streakWeeks === 1 ? '1 semana' : `${data.streakWeeks} semanas`} />
      <StatRow label="Séries esta semana" value={String(week.totalSets)} />
      <StatRow label="Calorias estimadas" value={`${week.estimatedCalories} kcal`} last />

      <SectionTitle>Peso</SectionTitle>
      {data.latestWeightKg != null ? (
        <View style={styles.weightRow}>
          <Text variant="big">{formatKg(data.latestWeightKg)} kg</Text>
          <Text variant="secondary">
            {data.weightTrend7d != null ? `${formatDeltaKg(data.weightTrend7d)} em 7 dias` : 'Sem tendência ainda'}
            {data.targetWeightKg != null ? ` · alvo ${formatKg(data.targetWeightKg)} kg` : ''}
          </Text>
        </View>
      ) : (
        <Text variant="secondary">Ainda sem registo de peso.</Text>
      )}
      <View style={styles.chart}>
        <WeightChart points={data.weightHistory} targetKg={data.targetWeightKg} />
      </View>
      <WeightInput />

      <SectionTitle>Recordes</SectionTitle>
      {data.recentRecords.length === 0 ? (
        <Text variant="secondary">Os recordes aparecem quando concluíres treinos.</Text>
      ) : (
        data.recentRecords.map((r, i) => (
          <Row
            key={`${r.exerciseId}-${r.metric}`}
            title={r.exerciseName}
            subtitle={`${RECORD_METRIC_LABELS[r.metric]} · ${formatDateShort(r.achievedAt)}`}
            value={formatRecordValue(r.metric, r.value)}
            last={i === data.recentRecords.length - 1}
          />
        ))
      )}
    </View>
  );
}

function SessionRow({ session, last, onPress }: { session: SessionSummary; last: boolean; onPress: () => void }) {
  const minutes = secondsToMinutes(session.durationSec);
  return (
    <Row
      title={session.workoutName}
      subtitle={`${formatDateShort(session.startedAt)} · ${minutes} min${session.rpe != null ? ` · RPE ${session.rpe}` : ''}`}
      onPress={onPress}
      last={last}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  hero: { marginBottom: spacing.sm },
  weightRow: { gap: 2, marginBottom: spacing.md },
  chart: { marginBottom: spacing.md },
  footer: { height: spacing.lg },
});
