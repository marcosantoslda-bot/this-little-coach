import { WORKOUT_FOCUS_LABELS, WORKOUT_FOCUSES, type WorkoutFocus, type WorkoutSource, type WorkoutSummary } from '@tlc/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ChipGroup, EmptyState, ErrorState, Loading, Row, Screen, SettingsButton, Text } from '@/components/ui';
import { difficultyDots } from '@/lib/format';
import { useWorkouts } from '@/lib/queries/workouts';
import { spacing } from '@/theme';

const DURATIONS = [15, 25, 40, 60];

const SOURCE_LABELS: Record<WorkoutSource, string> = {
  SYSTEM: 'Sistema',
  GENERATED: 'Gerado',
  USER: 'Meu',
};

export default function WorkoutsScreen() {
  const router = useRouter();
  const [focus, setFocus] = useState<WorkoutFocus | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const query = useWorkouts({ focus: focus ?? undefined, maxDurationMin: maxMinutes ?? undefined });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen title="Treinos" right={<SettingsButton />} scroll={false} contentStyle={styles.content}>
      <FlatList
        data={items}
        keyExtractor={(w) => w.id}
        ListHeaderComponent={
          <View style={styles.filters}>
            <ChipGroup
              horizontal
              options={[{ value: 'ALL', label: 'Todos' }, ...WORKOUT_FOCUSES.map((f) => ({ value: f, label: WORKOUT_FOCUS_LABELS[f] }))]}
              value={focus ?? 'ALL'}
              onChange={(v) => setFocus(v === 'ALL' ? null : (v as WorkoutFocus))}
            />
            <ChipGroup
              horizontal
              options={[{ value: 0, label: 'Qualquer duração' }, ...DURATIONS.map((m) => ({ value: m, label: `≤ ${m} min` }))]}
              value={maxMinutes ?? 0}
              onChange={(v) => setMaxMinutes(v === 0 ? null : v)}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <WorkoutRow
            workout={item}
            last={index === items.length - 1}
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message="Sem treinos para estes filtros." />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListFooterComponent={query.isFetchingNextPage ? <Loading /> : <View style={styles.footer} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function WorkoutRow({ workout, last, onPress }: { workout: WorkoutSummary; last: boolean; onPress: () => void }) {
  return (
    <Row
      title={workout.name}
      subtitle={`${WORKOUT_FOCUS_LABELS[workout.focus]} · ${workout.estimatedDurationMin} min · ${SOURCE_LABELS[workout.source]}`}
      right={<Text variant="secondary" accessibilityLabel={`Dificuldade ${workout.difficulty} de 5`}>{difficultyDots(workout.difficulty)}</Text>}
      onPress={onPress}
      last={last}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  filters: { gap: spacing.sm, paddingBottom: spacing.sm },
  footer: { height: spacing.lg },
});
