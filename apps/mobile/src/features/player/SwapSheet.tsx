import type { Exercise } from '@tlc/shared';
import { StyleSheet, View } from 'react-native';
import { Loading, Row, SectionTitle, Sheet, Text } from '@/components/ui';
import { difficultyDots } from '@/lib/format';
import { useExercise, useExercisesByIds } from '@/lib/queries/exercises';
import { spacing } from '@/theme';

export interface SwapSheetProps {
  visible: boolean;
  exercise: Exercise;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

/** Variantes mais fáceis / mais difíceis do exercício atual (GET /exercises/:id). */
export function SwapSheet({ visible, exercise, onClose, onSelect }: SwapSheetProps) {
  // Garante a versão completa do exercício (o snapshot da sessão já traz easierIds/harderIds).
  const full = useExercise(visible ? exercise.id : null);
  const source = full.data ?? exercise;
  const easier = useExercisesByIds(visible ? source.easierIds : []);
  const harder = useExercisesByIds(visible ? source.harderIds : []);
  const loading = full.isLoading || easier.isLoading || harder.isLoading;
  const empty = !loading && easier.exercises.length === 0 && harder.exercises.length === 0;

  const list = (title: string, items: Exercise[]) =>
    items.length > 0 ? (
      <View>
        <SectionTitle top={spacing.sm}>{title}</SectionTitle>
        {items.map((e, i) => (
          <Row
            key={e.id}
            title={e.name}
            subtitle={e.isUnilateral ? 'Cada lado' : undefined}
            value={difficultyDots(e.difficulty)}
            onPress={() => onSelect(e)}
            last={i === items.length - 1}
          />
        ))}
      </View>
    ) : null;

  return (
    <Sheet visible={visible} onClose={onClose} title="Trocar exercício">
      <Text variant="secondary" style={styles.current}>
        Atual: {exercise.name} · {difficultyDots(exercise.difficulty)}
      </Text>
      {loading ? <Loading /> : null}
      {list('Mais fácil', easier.exercises)}
      {list('Mais difícil', harder.exercises)}
      {empty ? <Text variant="secondary">Este exercício não tem variantes.</Text> : null}
      <View style={styles.bottom} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  current: { marginBottom: spacing.xs },
  bottom: { height: spacing.lg },
});
