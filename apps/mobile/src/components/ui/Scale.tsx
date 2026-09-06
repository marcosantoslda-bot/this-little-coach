import { Pressable, StyleSheet, View } from 'react-native';
import { hairline, radius, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface ScaleProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  /** Texto por baixo dos extremos ("Fácil" / "Máximo"). */
  minLabel?: string;
  maxLabel?: string;
}

/** Escala numérica (1–5, 1–10) em quadrados; quebra de linha automática. */
export function Scale({ min, max, value, onChange, minLabel, maxLabel }: ScaleProps) {
  const t = useTheme();
  const items: number[] = [];
  for (let i = min; i <= max; i++) items.push(i);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {items.map((n) => {
          const selected = n === value;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={String(n)}
              onPress={() => onChange(n)}
              style={[
                styles.box,
                { backgroundColor: selected ? t.primary : t.surface, borderColor: selected ? t.primary : t.border },
              ]}
            >
              <Text variant="bodyStrong" style={{ color: selected ? t.onPrimary : t.text }}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {minLabel || maxLabel ? (
        <View style={styles.labels}>
          <Text variant="caption">{minLabel ?? ''}</Text>
          <Text variant="caption">{maxLabel ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  box: {
    width: 48,
    height: 48,
    borderWidth: hairline,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
