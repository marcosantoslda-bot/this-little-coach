import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Vibração curta; ignora erros (web, simulador, permissões). */
export async function tap(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* sem haptics */
  }
}

export async function success(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* sem haptics */
  }
}
