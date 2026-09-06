import { Injectable } from '@nestjs/common';
import type { BodyMeasurement, Prisma } from '@tlc/database';
import type { UpsertBodyMeasurementInput } from '@tlc/shared';
import { fromIsoDate } from '../../common/mapping/primitives';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { recordInclude, type RecordRow, weekSessionSelect, type WeekSessionRow } from './progress.selectors';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Sessões concluídas com `completedAt` em [from, to). */
  findCompletedSessionsBetween(userId: string, from: Date, to: Date): Promise<WeekSessionRow[]> {
    return this.prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { gte: from, lt: to } },
      select: weekSessionSelect,
    });
  }

  /** Datas de conclusão (para a sequência de semanas). */
  async findCompletionDatesSince(userId: string, since: Date): Promise<Date[]> {
    const rows = await this.prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { gte: since } },
      select: { completedAt: true },
    });
    return rows.flatMap((r) => (r.completedAt ? [r.completedAt] : []));
  }

  findMeasurementsSince(userId: string, since: Date): Promise<BodyMeasurement[]> {
    return this.prisma.bodyMeasurement.findMany({
      where: { userId, measuredAt: { gte: since } },
      orderBy: [{ measuredAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findLatestWeight(userId: string): Promise<BodyMeasurement | null> {
    return this.prisma.bodyMeasurement.findFirst({
      where: { userId, weightKg: { not: null } },
      orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  upsertManualMeasurement(userId: string, input: UpsertBodyMeasurementInput): Promise<BodyMeasurement> {
    const { measuredAt, ...values } = input;
    const data: Prisma.BodyMeasurementUncheckedUpdateInput = values;
    return this.prisma.bodyMeasurement.upsert({
      where: { userId_measuredAt_source: { userId, measuredAt: fromIsoDate(measuredAt), source: 'MANUAL' } },
      create: { userId, measuredAt: fromIsoDate(measuredAt), source: 'MANUAL', ...values },
      update: data,
    });
  }

  findRecords(userId: string, take?: number): Promise<RecordRow[]> {
    return this.prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
      ...(take ? { take } : {}),
      include: recordInclude,
    });
  }
}
