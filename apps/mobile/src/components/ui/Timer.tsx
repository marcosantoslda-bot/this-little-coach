import { formatDuration } from '@tlc/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fontSize } from '@/theme';
import { Text } from './Text';

export type TimerMode = 'countdown' | 'stopwatch';

export interface UseTimerOptions {
  mode: TimerMode;
  /** Segundos iniciais (countdown) — ignorado no cronómetro. */
  seconds?: number;
  autoStart?: boolean;
  onFinish?: () => void;
}

export interface TimerState {
  /** Segundos mostrados (restantes ou decorridos). */
  display: number;
  /** Segundos decorridos desde o arranque (ambos os modos). */
  elapsed: number;
  running: boolean;
  finished: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: (seconds?: number) => void;
}

/** Temporizador baseado em timestamps (não deriva se o JS atrasar). */
export function useTimer({ mode, seconds = 0, autoStart = false, onFinish }: UseTimerOptions): TimerState {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const [total, setTotal] = useState(seconds);
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    const tick = () => {
      const now = Date.now();
      const e = baseRef.current + (now - (startedAtRef.current ?? now)) / 1000;
      setElapsed(e);
      if (mode === 'countdown' && e >= total && !finishedRef.current) {
        finishedRef.current = true;
        setRunning(false);
        onFinishRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => {
      clearInterval(id);
      const now = Date.now();
      baseRef.current += (now - (startedAtRef.current ?? now)) / 1000;
      startedAtRef.current = null;
    };
  }, [running, mode, total]);

  const start = useCallback(() => {
    if (finishedRef.current) return;
    setRunning(true);
  }, []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => (finishedRef.current ? false : !r)), []);
  const reset = useCallback(
    (next?: number) => {
      setRunning(false);
      baseRef.current = 0;
      startedAtRef.current = null;
      finishedRef.current = false;
      setElapsed(0);
      if (next !== undefined) setTotal(next);
      if (autoStart) setRunning(true);
    },
    [autoStart],
  );

  const display = mode === 'countdown' ? Math.max(0, Math.ceil(total - elapsed)) : Math.floor(elapsed);
  return { display, elapsed: Math.floor(elapsed), running, finished: finishedRef.current, start, pause, toggle, reset };
}

/** Número enorme com o tempo — a única coisa que importa durante a série. */
export function TimerDisplay({ seconds, caption }: { seconds: number; caption?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.time} accessibilityLiveRegion="polite">
        {formatDuration(Math.max(0, seconds))}
      </Text>
      {caption ? (
        <Text variant="label" align="center">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  time: { fontSize: 72, fontWeight: '700', letterSpacing: -2, lineHeight: 80, fontVariant: ['tabular-nums'] },
  small: { fontSize: fontSize.big },
});
