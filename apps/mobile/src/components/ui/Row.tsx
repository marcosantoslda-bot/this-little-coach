import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { hairline, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface RowProps {
  title: string;
  subtitle?: string;
  /** Texto à direita (valor). */
  value?: string;
  /** Elemento à direita em vez de `value`. */
  right?: ReactNode;
  onPress?: () => void;
  /** Esconde o divisor inferior (última linha). */
  last?: boolean;
  chevron?: boolean;
}

/** Linha de lista com divisor hairline. Sem cartões: a lista é a UI. */
export function Row({ title, subtitle, value, right, onPress, last, chevron }: RowProps) {
  const t = useTheme();
  const content = (
    <View style={[styles.row, { borderBottomColor: t.border, borderBottomWidth: last ? 0 : hairline }]}>
      <View style={styles.left}>
        <Text variant="body" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text variant="body">{value}</Text> : right}
      {chevron ?? !!onPress ? (
        <Ionicons name="chevron-forward" size={18} color={t.textSecondary} style={styles.chevron} />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

/** Título de secção: 13px maiúsculas com espaçamento. */
export function SectionTitle({ children, top = spacing.lg }: { children: string; top?: number }) {
  return (
    <Text variant="label" style={{ marginTop: top, marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

/** Par chave/valor numa linha (estatísticas). */
export function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.stat, { borderBottomColor: t.border, borderBottomWidth: last ? 0 : hairline }]}>
      <Text variant="secondary">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  left: { flex: 1, gap: 2 },
  chevron: { marginLeft: -spacing.sm },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
