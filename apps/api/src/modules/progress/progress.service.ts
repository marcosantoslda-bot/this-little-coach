import { Injectable } from '@nestjs/common';
import type { BodyMeasurement, PersonalRecord, ProgressOverview, UpsertBodyMeasurementInput } from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { toIsoDate, toNumber } from '../../common/mapping/primitives';
import { addDays, safeTimeZone, weekBoundsInZone } from '../../common/time/week';
import { UsersRepository } from '../users/users.repository';
import { computeStreakWeeks, computeWeekStats, computeWeightTrend7d, type WeightPoint } from './progress.calculations';
import { toBodyMeasurement, toPersonalRecord } from './progress.mapper';
import { ProgressRepository } from './progress.repository';

const HISTORY_DAYS = 90;
const STREAK_LOOKBACK_DAYS = 2 * 366;
const RECENT_RECORDS = 5;
const DEFAULT_SESSIONS_TARGET = 3;

@Injectable()
export class ProgressService {
  constructor(
    private readonly progress: ProgressRepository,
    private readonly users: UsersRepository,
  ) {}

  async overview(user: AuthenticatedUser, now = new Date()): Promise<ProgressOverview> {
    const timeZone = safeTimeZone(user.timezone);
    const { start, end } = weekBoundsInZone(now, timeZone);

    const [weekSessions, completionDates, measurements, latestWeight, profile, records] = await Promise.all([
      this.progress.findCompletedSessionsBetween(user.id, start, end),
      this.progress.findCompletionDatesSince(user.id, addDays(start, -STREAK_LOOKBACK_DAYS)),
      this.progress.findMeasurementsSince(user.id, addDays(now, -HISTORY_DAYS)),
      this.progress.findLatestWeight(user.id),
      this.users.findProfile(user.id),
      this.progress.findRecords(user.id, RECENT_RECORDS),
    ]);

    const weightHistory: WeightPoint[] = measurements.flatMap((m) =>
      m.weightKg ? [{ date: toIsoDate(m.measuredAt), weightKg: toNumber(m.weightKg) }] : [],
    );

    return {
      week: computeWeekStats(weekSessions, profile?.trainingDaysPerWeek ?? DEFAULT_SESSIONS_TARGET),
      streakWeeks: computeStreakWeeks(completionDates, now, timeZone),
      latestWeightKg: toNumber(latestWeight?.weightKg),
      weightTrend7d: computeWeightTrend7d(weightHistory),
      targetWeightKg: toNumber(profile?.targetWeightKg),
      recentRecords: records.map((r) => toPersonalRecord(r, user.locale)),
      weightHistory,
    };
  }

  async listMeasurements(user: AuthenticatedUser, now = new Date()): Promise<BodyMeasurement[]> {
    const rows = await this.progress.findMeasurementsSince(user.id, addDays(now, -HISTORY_DAYS));
    return rows.map(toBodyMeasurement);
  }

  async upsertMeasurement(user: AuthenticatedUser, input: UpsertBodyMeasurementInput): Promise<BodyMeasurement> {
    const row = await this.progress.upsertManualMeasurement(user.id, input);
    return toBodyMeasurement(row);
  }

  async listRecords(user: AuthenticatedUser): Promise<PersonalRecord[]> {
    const rows = await this.progress.findRecords(user.id);
    return rows.map((r) => toPersonalRecord(r, user.locale));
  }
}
