import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { fontSize, hairline, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface FieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Sufixo à direita ("kg", "cm"). */
  suffix?: string;
}

/** Campo de texto: etiqueta em maiúsculas, linha hairline por baixo. */
export function Field({ label, error, hint, suffix, style, ...rest }: FieldProps) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={[styles.inputRow, { borderBottomColor: error ? t.text : t.border }]}>
        <TextInput
          placeholderTextColor={t.textSecondary}
          selectionColor={t.text}
          style={[styles.input, { color: t.text }, style]}
          {...rest}
        />
        {suffix ? <Text variant="secondary">{suffix}</Text> : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: t.text }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: hairline,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    paddingVertical: 12,
    minHeight: 48,
  },
});
