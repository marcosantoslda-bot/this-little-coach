import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Field, Scale, SectionTitle, Text } from '@/components/ui';
import { MOOD_LABELS } from '@/lib/labels';
import { spacing } from '@/theme';

export interface FinishValues {
  rpe: number | null;
  moodAfter: number | null;
  rating: number | null;
  notes: string | null;
}

export interface FinishFormProps {
  durationSec: number;
  setsDone: number;
  pendingSync: number;
  loading: boolean;
  error: string | null;
  onSave: (values: FinishValues) => void;
  onAbandon: () => void;
}

export function FinishForm({ durationSec, setsDone, pendingSync, loading, error, onSave, onAbandon }: FinishFormProps) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="label">Treino terminado</Text>
        <Text variant="display">{Math.max(1, Math.round(durationSec / 60))} min</Text>
        <Text variant="secondary">
          {setsDone} séries{pendingSync > 0 ? ` · ${pendingSync} por sincronizar` : ''}
        </Text>

        <SectionTitle>Esforço (RPE)</SectionTitle>
        <Scale min={1} max={10} value={rpe} onChange={setRpe} minLabel="Muito leve" maxLabel="Máximo" />

        <SectionTitle>Como te sentes agora</SectionTitle>
        <Scale min={1} max={5} value={mood} onChange={setMood} minLabel={MOOD_LABELS[1]} maxLabel={MOOD_LABELS[5]} />

        <SectionTitle>Avaliação do treino</SectionTitle>
        <Scale min={1} max={5} value={rating} onChange={setRating} minLabel="Fraco" maxLabel="Excelente" />

        <View style={styles.notes}>
          <Field label="Notas" value={notes} onChangeText={setNotes} multiline placeholder="Opcional" maxLength={500} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.bottom}>
        <Button
          title="Guardar treino"
          loading={loading}
          onPress={() => onSave({ rpe, moodAfter: mood, rating, notes: notes.trim() ? notes.trim() : null })}
        />
        <Button title="Terminar sem guardar" variant="ghost" onPress={onAbandon} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  notes: { marginTop: spacing.lg },
  error: { marginTop: spacing.md },
  bottom: { gap: spacing.xs, paddingBottom: spacing.sm },
});
