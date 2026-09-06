import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type { UsersRepository } from '../users/users.repository';
import type { ProgressRepository } from './progress.repository';
import type { WeekSessionRow } from './progress.selectors';
import { ProgressService } from './progress.service';

vi.mock('../../infra/prisma/prisma.service', () => ({ PrismaService: class {} }));

const USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  authId: '22222222-2222-4222-8222-222222222222',
  email: 'ana@example.com',
  locale: 'pt-PT',
  timezone: 'Europe/Lisbon',
  role: 'MEMBER',
};

/** Quarta-feira, 9 de setembro de 2026, 10:00 UTC (11:00 em Lisboa). */
const NOW = new Date('2026-09-09T10:00:00Z');

function weekSession(partial: Partial<WeekSessionRow>): WeekSessionRow {
  return { id: crypto.randomUUID(), completedAt: NOW, durationSec: 0, estimatedCalories: 0, sets: [], ...partial } as WeekSessionRow;
}
const set = (movementPattern: string, skipped = false) => ({ skipped, exercise: { movementPattern } }) as WeekSessionRow['sets'][number];

function measurement(measuredAt: string, weightKg: number | null) {
  return {
    id: crypto.randomUUID(), userId: USER.id, measuredAt: new Date(`${measuredAt}T00:00:00Z`), source: 'MANUAL', weightKg,
    bodyFatPct: null, waistCm: null, hipCm: null, chestCm: null, notes: null, createdAt: new Date(),
  };
}

describe('ProgressService.overview', () => {
  let progress: Record<string, ReturnType<typeof vi.fn>>;
  let users: { findProfile: ReturnType<typeof vi.fn> };
  let service: ProgressService;

  beforeEach(() => {
    progress = {
      findCompletedSessionsBetween: vi.fn(async () => []),
      findCompletionDatesSince: vi.fn(async () => []),
      findMeasurementsSince: vi.fn(async () => []),
      findLatestWeight: vi.fn(async () => null),
      findRecords: vi.fn(async () => []),
    };
    users = { findProfile: vi.fn(async () => ({ trainingDaysPerWeek: 4, targetWeightKg: 75 })) };
    service = new ProgressService(progress as unknown as ProgressRepository, users as unknown as UsersRepository);
  });

  it('queries the current Monday–Sunday week in the user timezone', async () => {
    await service.overview(USER, NOW);

    // Segunda 2026-09-07 00:00 Lisboa (UTC+1) -> 2026-09-06T23:00Z ; fim = segunda seguinte
    expect(progress.findCompletedSessionsBetween).toHaveBeenCalledWith(
      USER.id, new Date('2026-09-06T23:00:00.000Z'), new Date('2026-09-13T23:00:00.000Z'),
    );
  });

  it('aggregates week stats from completed sessions and their sets', async () => {
    progress.findCompletedSessionsBetween!.mockResolvedValue([
      weekSession({ durationSec: 1800, estimatedCalories: 200, sets: [set('SQUAT'), set('SQUAT'), set('PUSH_HORIZONTAL'), set('HINGE', true)] }),
      weekSession({ durationSec: 1500, estimatedCalories: 150, sets: [set('PULL_HORIZONTAL'), set('SQUAT')] }),
    ]);

    const overview = await service.overview(USER, NOW);

    expect(overview.week).toEqual({
      sessionsCompleted: 2,
      sessionsTarget: 4,
      totalMinutes: 55,
      totalSets: 5,
      estimatedCalories: 350,
      setsByPattern: { SQUAT: 3, PUSH_HORIZONTAL: 1, PULL_HORIZONTAL: 1 },
    });
  });

  it('counts consecutive weeks with at least one completed session, ending this week', async () => {
    progress.findCompletionDatesSince!.mockResolvedValue([
      new Date('2026-09-08T18:00:00Z'), // esta semana
      new Date('2026-09-02T18:00:00Z'), // semana passada
      new Date('2026-09-04T07:00:00Z'), // semana passada (repetida)
      new Date('2026-08-26T18:00:00Z'), // há 2 semanas
      new Date('2026-08-12T18:00:00Z'), // há 4 semanas — a semana de 17/08 está vazia: quebra
    ]);

    const overview = await service.overview(USER, NOW);
    expect(overview.streakWeeks).toBe(3);
  });

  it('keeps the streak alive when this week has no session yet (counts from last week)', async () => {
    progress.findCompletionDatesSince!.mockResolvedValue([
      new Date('2026-09-06T21:30:00Z'), // domingo 22:30 em Lisboa -> ainda semana passada
      new Date('2026-08-27T18:00:00Z'),
    ]);

    const overview = await service.overview(USER, NOW);
    expect(overview.streakWeeks).toBe(2);
  });

  it('returns 0 streak when the last session is older than last week', async () => {
    progress.findCompletionDatesSince!.mockResolvedValue([new Date('2026-08-20T18:00:00Z')]);
    expect((await service.overview(USER, NOW)).streakWeeks).toBe(0);
  });

  it('exposes latest weight, 7-day trend, target and history', async () => {
    const history = [measurement('2026-08-30', 80.4), measurement('2026-09-01', 80), measurement('2026-09-05', null), measurement('2026-09-08', 79.2)];
    progress.findMeasurementsSince!.mockResolvedValue(history);
    progress.findLatestWeight!.mockResolvedValue(history[3]);

    const overview = await service.overview(USER, NOW);

    expect(overview.latestWeightKg).toBe(79.2);
    expect(overview.weightTrend7d).toBe(-0.8); // 79.2 (08/09) - 80 (01/09)
    expect(overview.targetWeightKg).toBe(75);
    expect(overview.weightHistory).toEqual([
      { date: '2026-08-30', weightKg: 80.4 },
      { date: '2026-09-01', weightKg: 80 },
      { date: '2026-09-08', weightKg: 79.2 },
    ]);
  });

  it('returns nulls and defaults when there is no data', async () => {
    users.findProfile.mockResolvedValue(null);
    const overview = await service.overview(USER, NOW);

    expect(overview.week.sessionsTarget).toBe(3);
    expect(overview.latestWeightKg).toBeNull();
    expect(overview.weightTrend7d).toBeNull();
    expect(overview.targetWeightKg).toBeNull();
    expect(overview.recentRecords).toEqual([]);
    expect(overview.weightHistory).toEqual([]);
  });
});
