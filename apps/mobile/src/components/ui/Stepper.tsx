import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { hairline, radius, useTheme } from '@/theme';
import { Text } from './Text';

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Texto a mostrar (ex.: "30 min"). Por defeito, o número. */
  format?: (value: number) => string;
  /** Número grande (ecrãs onde o valor é o protagonista). */
  big?: boolean;
}

export function Stepper({ value, min, max, step = 1, onChange, format, big }: StepperProps) {
  const t = useTheme();
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const label = format ? format(value) : String(value);

  const btn = (icon: 'remove' | 'add', onPress: () => void, disabled: boolean, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: t.text, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={t.text} />
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {btn('remove', dec, value <= min, 'Menos')}
      <Text variant={big ? 'big' : 'title'} align="center" style={styles.value}>
        {label}
      </Text>
      {btn('add', inc, value >= max, 'Mais')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { flex: 1 },
});
