import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/theme';
import { errorMessage } from '@/lib/api';
import { Button } from './Button';
import { Text } from './Text';

export function Loading({ label }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={t.text} />
      {label ? <Text variant="secondary">{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text align="center">{errorMessage(error)}</Text>
      {onRetry ? <Button title="Tentar de novo" variant="secondary" compact onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text variant="secondary" align="center">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.md },
});
