import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { hairline, radius, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected, onPress, disabled }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.primary : t.surface,
          borderColor: selected ? t.primary : t.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="secondary" inverted={selected} style={{ color: selected ? t.onPrimary : t.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface ChipOption<V extends string | number> {
  value: V;
  label: string;
}

interface ChipGroupBase<V extends string | number> {
  options: ChipOption<V>[];
  /** Uma linha com scroll horizontal em vez de quebra de linha. */
  horizontal?: boolean;
}

interface SingleChipGroup<V extends string | number> extends ChipGroupBase<V> {
  multi?: false;
  value: V | null;
  onChange: (value: V) => void;
}

interface MultiChipGroup<V extends string | number> extends ChipGroupBase<V> {
  multi: true;
  value: V[];
  onChange: (value: V[]) => void;
}

export type ChipGroupProps<V extends string | number> = SingleChipGroup<V> | MultiChipGroup<V>;

/** Grupo de chips; seleção única ou múltipla. */
export function ChipGroup<V extends string | number>(props: ChipGroupProps<V>) {
  const isSelected = (v: V) => (props.multi ? props.value.includes(v) : props.value === v);
  const toggle = (v: V) => {
    if (props.multi) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };
  const chips = props.options.map((o) => (
    <Chip key={String(o.value)} label={o.label} selected={isSelected(o.value)} onPress={() => toggle(o.value)} />
  ));
  if (props.horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.wrap}>{chips}</View>;
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: hairline,
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
