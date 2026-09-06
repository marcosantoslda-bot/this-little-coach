import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hairline, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface ScreenProps {
  /** Título grande do ecrã (opcional; alguns ecrãs desenham o seu próprio topo). */
  title?: string;
  subtitle?: string;
  /** Mostra seta de voltar. */
  back?: boolean;
  /** Elemento à direita do título (ex.: ícone de definições). */
  right?: ReactNode;
  /** Se falso, o conteúdo não faz scroll (ecrãs de player). */
  scroll?: boolean;
  /** Ação primária fixa em baixo. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Ignora a safe area no topo (ecrãs com header próprio). */
  noTopInset?: boolean;
}

export function Screen({
  title,
  subtitle,
  back,
  right,
  scroll = true,
  footer,
  contentStyle,
  children,
  noTopInset,
}: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const header =
    title || back || right ? (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={12}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={t.text} />
            </Pressable>
          ) : null}
          {title ? (
            <View style={styles.titleBlock}>
              <Text variant="big">{title}</Text>
              {subtitle ? (
                <Text variant="secondary" style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    ) : null;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>
      {header}
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: t.bg, paddingTop: noTopInset ? 0 : insets.top }]}
    >
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.md), borderTopColor: t.border, backgroundColor: t.bg },
          ]}
        >
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </KeyboardAvoidingView>
  );
}

/** Ícone de definições para o canto superior direito. */
export function SettingsButton() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Definições"
      hitSlop={12}
      onPress={() => router.push('/settings')}
    >
      <Ionicons name="settings-outline" size={24} color={t.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { paddingVertical: spacing.xs, marginLeft: -4 },
  titleBlock: { flex: 1 },
  subtitle: { marginTop: 2 },
  right: { paddingTop: spacing.sm, marginLeft: spacing.md },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: hairline,
    gap: spacing.sm,
  },
});
