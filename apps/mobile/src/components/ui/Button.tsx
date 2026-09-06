import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { hairline, radius, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Botão pequeno (em linha), sem largura total. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * primary: preto com texto branco (uma por ecrã).
 * secondary: contorno hairline.
 * ghost: só texto sublinhado (também para ações destrutivas — sem vermelho).
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  compact,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  const base: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: t.primary, borderColor: t.primary }
      : variant === 'secondary'
        ? { backgroundColor: t.surface, borderColor: t.text }
        : { backgroundColor: 'transparent', borderColor: 'transparent' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.full,
        base,
        { opacity: isDisabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? t.onPrimary : t.text} />
      ) : (
        <Text
          variant="bodyStrong"
          inverted={variant === 'primary'}
          style={variant === 'ghost' ? styles.ghostText : undefined}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { minHeight: 56, paddingHorizontal: spacing.lg, alignSelf: 'stretch' },
  compact: { minHeight: 44, paddingHorizontal: spacing.md, alignSelf: 'flex-start' },
  ghostText: { textDecorationLine: 'underline' },
});
