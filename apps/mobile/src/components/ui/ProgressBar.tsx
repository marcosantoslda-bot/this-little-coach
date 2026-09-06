import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

export interface ProgressBarProps {
  /** 0–1 */
  value: number;
  height?: number;
}

export function ProgressBar({ value, height = 4 }: ProgressBarProps) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.track, { height, backgroundColor: t.border }]}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: t.text }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
});
