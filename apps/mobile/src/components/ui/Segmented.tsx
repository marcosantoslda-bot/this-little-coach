import { Pressable, StyleSheet, View } from 'react-native';
import { hairline, radius, useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentedOption<V extends string | number> {
  value: V;
  label: string;
}

export interface SegmentedProps<V extends string | number> {
  options: SegmentedOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  /** Texto mais pequeno quando há muitos segmentos. */
  dense?: boolean;
}

/** Controlo segmentado: contorno hairline, segmento ativo preto. */
export function Segmented<V extends string | number>({ options, value, onChange, dense }: SegmentedProps<V>) {
  const t = useTheme();
  return (
    <View style={[styles.container, { borderColor: t.text }]}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? t.primary : t.surface,
                borderLeftWidth: i === 0 ? 0 : hairline,
                borderLeftColor: t.text,
              },
            ]}
          >
            <Text
              variant={dense ? 'caption' : 'bodyStrong'}
              numberOfLines={1}
              style={{ color: selected ? t.onPrimary : t.text }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: hairline,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
