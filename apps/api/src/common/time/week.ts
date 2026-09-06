/**
 * Utilitários de calendário sensíveis ao fuso horário do utilizador.
 * Semana = segunda-feira 00:00 até domingo 23:59:59 no fuso indicado.
 * Só usa `Intl` (sem dependências).
 */
export const DEFAULT_TIME_ZONE = 'Europe/Lisbon';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number;
  minute: number;
  second: number;
  /** 0 = segunda ... 6 = domingo */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const formatterCache = new Map<string, Intl.DateTimeFormat>();

export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return DEFAULT_TIME_ZONE;
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatterCache.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, cached);
  }
  return cached;
}

export function localDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = formatter(safeTimeZone(timeZone)).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: WEEKDAYS[get('weekday')] ?? 0,
  };
}

/** Instante UTC que corresponde à meia-noite local de (ano, mês, dia) no fuso. */
export function zonedMidnightToUtc(year: number, month: number, day: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0);
  let guess = wallClock;
  // Duas iterações chegam para convergir mesmo em transições de hora de verão.
  for (let i = 0; i < 2; i += 1) {
    const p = localDateParts(new Date(guess), timeZone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const offset = asUtc - guess;
    guess = wallClock - offset;
  }
  return new Date(guess);
}

/** Segunda-feira 00:00 (no fuso) da semana que contém `date`. */
export function startOfWeekInZone(date: Date, timeZone: string): Date {
  const p = localDateParts(date, timeZone);
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day) - p.weekday * DAY_MS);
  return zonedMidnightToUtc(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), timeZone);
}

/** Segunda-feira da semana anterior à semana que começa em `weekStart`. */
export function previousWeekStart(weekStart: Date, timeZone: string): Date {
  return startOfWeekInZone(new Date(weekStart.getTime() - 12 * 60 * 60 * 1000), timeZone);
}

/** Intervalo [segunda 00:00, próxima segunda 00:00) no fuso. */
export function weekBoundsInZone(date: Date, timeZone: string): { start: Date; end: Date } {
  const start = startOfWeekInZone(date, timeZone);
  const end = startOfWeekInZone(new Date(start.getTime() + 7 * DAY_MS + 12 * 60 * 60 * 1000), timeZone);
  return { start, end };
}

/** Chave estável da semana (YYYY-MM-DD da segunda-feira local). */
export function weekKey(date: Date, timeZone: string): string {
  const p = localDateParts(startOfWeekInZone(date, timeZone), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
