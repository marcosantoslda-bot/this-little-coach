import { toIsoDate, upsertBodyMeasurementSchema } from '@tlc/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Field, Text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { parseDecimal } from '@/lib/format';
import { useUpsertMeasurement } from '@/lib/queries/progress';
import { spacing } from '@/theme';

/** "Registar peso" em linha: campo + botão. Guarda para hoje (upsert por dia). */
export function WeightInput() {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const upsert = useUpsertMeasurement();

  function save() {
    setError(null);
    setSaved(false);
    const weightKg = parseDecimal(text);
    const parsed = upsertBodyMeasurementSchema.safeParse({ measuredAt: toIsoDate(), weightKg });
    if (!parsed.success || weightKg == null) {
      setError('Introduz um peso entre 25 e 300 kg.');
      return;
    }
    upsert.mutate(parsed.data, {
      onSuccess: () => {
        setText('');
        setSaved(true);
      },
      onError: (e) => setError(errorMessage(e)),
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Field
            label="Registar peso"
            value={text}
            onChangeText={(v) => {
              setText(v);
              setSaved(false);
            }}
            keyboardType="decimal-pad"
            placeholder="72,4"
            suffix="kg"
            onSubmitEditing={save}
            returnKeyType="done"
          />
        </View>
        <Button title="Guardar" variant="secondary" compact onPress={save} loading={upsert.isPending} disabled={text.trim().length === 0} />
      </View>
      {error ? <Text variant="caption">{error}</Text> : saved ? <Text variant="caption">Peso de hoje guardado.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  field: { flex: 1 },
});
