import { describe, expect, it } from 'vitest';
import { previousWeekStart, startOfWeekInZone, weekBoundsInZone, weekKey } from './week';

const TZ = 'Europe/Lisbon';

describe('week utils (timezone-aware)', () => {
  it('starts the week on Monday 00:00 local time (summer, UTC+1)', () => {
    // Wednesday 2026-09-09 10:00Z -> Monday 2026-09-07 00:00 Lisbon = 2026-09-06T23:00:00Z
    const start = startOfWeekInZone(new Date('2026-09-09T10:00:00Z'), TZ);
    expect(start.toISOString()).toBe('2026-09-06T23:00:00.000Z');
    expect(weekKey(new Date('2026-09-09T10:00:00Z'), TZ)).toBe('2026-09-07');
  });

  it('handles Sunday late evening local time that is already Monday in UTC', () => {
    // 2026-01-04 (Sunday) 23:30 Lisbon (UTC+0 in winter) -> still Sunday, week of 2025-12-29
    expect(weekKey(new Date('2026-01-04T23:30:00Z'), TZ)).toBe('2025-12-29');
    // New York: 2026-01-04T23:30Z is Sunday 18:30 local
    expect(weekKey(new Date('2026-01-04T23:30:00Z'), 'America/New_York')).toBe('2025-12-29');
    // Tokyo: 2026-01-04T23:30Z is Monday 08:30 local
    expect(weekKey(new Date('2026-01-04T23:30:00Z'), 'Asia/Tokyo')).toBe('2026-01-05');
  });

  it('computes [monday, next monday) bounds across a DST change', () => {
    // Lisbon leaves DST on 2026-10-25; the week 2026-10-19..2026-10-26 has 169 hours.
    const { start, end } = weekBoundsInZone(new Date('2026-10-21T12:00:00Z'), TZ);
    expect(start.toISOString()).toBe('2026-10-18T23:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-26T00:00:00.000Z');
    expect(previousWeekStart(end, TZ).toISOString()).toBe(start.toISOString());
  });

  it('falls back to Europe/Lisbon for an invalid timezone', () => {
    expect(weekKey(new Date('2026-09-09T10:00:00Z'), 'Not/AZone')).toBe('2026-09-07');
  });
});
