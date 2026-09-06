/** Devolve YYYY-MM-DD na timezone local do dispositivo. */
export function toIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Segunda-feira 00:00 (local) da semana da data dada. */
export function startOfWeek(d: Date = new Date()): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // 0 = segunda
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
