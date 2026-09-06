import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui';
import { formatDateShort, formatKg } from '@/lib/format';
import { spacing, useTheme } from '@/theme';

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface WeightChartProps {
  points: WeightPoint[];
  /** Linha tracejada com o peso-alvo (opcional). */
  targetKg?: number | null;
  height?: number;
}

const PAD_LEFT = 40;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

/** Gráfico de linha a preto; sem biblioteca de gráficos (ADR-0002). */
export function WeightChart({ points, targetKg, height = 140 }: WeightChartProps) {
  const t = useTheme();
  const [width, setWidth] = useState(0);

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) {
    return (
      <View style={[styles.empty, { borderColor: t.border }]}>
        <Text variant="secondary" align="center">
          Regista o peso em dois dias diferentes para veres a evolução.
        </Text>
      </View>
    );
  }

  const values = sorted.map((p) => p.weightKg);
  const allValues = targetKg != null ? [...values, targetKg] : values;
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = Math.max(0.5, maxV - minV);
  const lo = minV - range * 0.1;
  const hi = maxV + range * 0.1;

  const plotW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_LEFT + (sorted.length === 1 ? 0 : (i / (sorted.length - 1)) * plotW);
  const y = (v: number) => PAD_TOP + (1 - (v - lo) / (hi - lo)) * plotH;

  const polyline = sorted.map((p, i) => `${x(i)},${y(p.weightKg)}`).join(' ');
  const first = sorted[0];
  const lastPoint = sorted[sorted.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* Eixo: máximo e mínimo */}
          <SvgText x={PAD_LEFT - 6} y={y(maxV) + 4} fontSize={11} fill={t.textSecondary} textAnchor="end">
            {formatKg(maxV)}
          </SvgText>
          <SvgText x={PAD_LEFT - 6} y={y(minV) + 4} fontSize={11} fill={t.textSecondary} textAnchor="end">
            {formatKg(minV)}
          </SvgText>
          <Line x1={PAD_LEFT} y1={y(maxV)} x2={width - PAD_RIGHT} y2={y(maxV)} stroke={t.border} strokeWidth={1} />
          <Line x1={PAD_LEFT} y1={y(minV)} x2={width - PAD_RIGHT} y2={y(minV)} stroke={t.border} strokeWidth={1} />

          {targetKg != null ? (
            <Line
              x1={PAD_LEFT}
              y1={y(targetKg)}
              x2={width - PAD_RIGHT}
              y2={y(targetKg)}
              stroke={t.textSecondary}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ) : null}

          <Polyline points={polyline} fill="none" stroke={t.text} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {lastPoint ? <Circle cx={x(sorted.length - 1)} cy={y(lastPoint.weightKg)} r={4} fill={t.text} /> : null}
        </Svg>
      ) : null}
      <View style={styles.axis}>
        <Text variant="caption">{first ? formatDateShort(first.date) : ''}</Text>
        <Text variant="caption">{lastPoint ? formatDateShort(lastPoint.date) : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: PAD_LEFT, paddingTop: spacing.xs },
  empty: { borderWidth: 1, borderRadius: 12, padding: spacing.md },
});
