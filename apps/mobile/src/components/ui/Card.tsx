import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { hairline, radius, spacing, useTheme } from '@/theme';

/** Retângulo com contorno hairline e cantos 12. Sem sombra, sem fundo. */
export function Card({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: hairline,
    borderRadius: radius.card,
    padding: spacing.md,
  },
});
