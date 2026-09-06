import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hairline, spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

/** Folha inferior simples (Modal nativo), fundo escurecido a preto translúcido. */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <View
        style={[
          styles.sheet,
          { backgroundColor: t.bg, borderColor: t.border, paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <Text variant="title">{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={12} onPress={onClose}>
            <Ionicons name="close" size={24} color={t.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/** Confirmação de ação irreversível. Sem vermelho: contorno + texto. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading,
}: ConfirmSheetProps) {
  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.actions}>
        <Button title={confirmLabel} variant="secondary" onPress={onConfirm} loading={loading} />
        <Button title={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: hairline,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: hairline,
  },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  message: { marginBottom: spacing.md },
  actions: { gap: spacing.sm },
});
