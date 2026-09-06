import { Injectable } from '@nestjs/common';
import type { PersonalRecord, Prisma } from '@tlc/database';
import type { RecordMetric, SessionQuery, SessionSet } from '@tlc/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  sessionInclude, type SessionRow, sessionSummaryInclude, type SessionSummaryRow, setWithExerciseInclude,
  type SetWithExerciseRow,
} from './sessions.selectors';

export type SessionFilters = Pick<SessionQuery, 'from' | 'to' | 'status'>;

export interface RecordUpsert {
  userId: string;
  exerciseId: string;
  metric: RecordMetric;
  value: number;
  sessionId: string;
  achievedAt: Date;
}

/**
 * Acesso a dados de sessões. `runInTransaction` devolve uma cópia do repositório
 * ligada ao cliente transacional, para o serviço compor várias operações atómicas
 * sem conhecer o Prisma.
 */
@Injectable()
export class SessionsRepository {
  private db: Prisma.TransactionClient;

  constructor(private readonly prisma: PrismaService) {
    this.db = prisma;
  }

  runInTransaction<T>(work: (repo: SessionsRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(this.boundTo(tx)));
  }

  private boundTo(tx: Prisma.TransactionClient): SessionsRepository {
    const bound = Object.create(SessionsRepository.prototype) as SessionsRepository;
    Object.assign(bound, { prisma: this.prisma, db: tx });
    return bound;
  }

  create(data: Prisma.WorkoutSessionUncheckedCreateInput): Promise<SessionRow> {
    return this.db.workoutSession.create({ data, include: sessionInclude });
  }

  findOwnById(id: string, userId: string): Promise<SessionRow | null> {
    return this.db.workoutSession.findFirst({ where: { id, userId }, include: sessionInclude });
  }

  findManyOwn(userId: string, filters: SessionFilters, page: { cursor?: string; take: number }): Promise<SessionSummaryRow[]> {
    return this.db.workoutSession.findMany({
      where: {
        userId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.from || filters.to
          ? { startedAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } }
          : {}),
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: page.take,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
      include: sessionSummaryInclude,
    });
  }

  update(id: string, data: Prisma.WorkoutSessionUncheckedUpdateInput): Promise<SessionRow> {
    return this.db.workoutSession.update({ where: { id }, data, include: sessionInclude });
  }

  /** Upsert idempotente por id (gerado no cliente). Um id de outra sessão dá conflito (P2002). */
  async upsertSets(sessionId: string, sets: SessionSet[]): Promise<void> {
    for (const set of sets) {
      const { id, completedAt, ...fields } = set;
      const data = { ...fields, completedAt: new Date(completedAt) };
      await this.db.sessionSet.upsert({
        where: { id, sessionId },
        create: { id, sessionId, ...data },
        update: data,
      });
    }
  }

  findSetsWithExercise(sessionId: string): Promise<SetWithExerciseRow[]> {
    return this.db.sessionSet.findMany({
      where: { sessionId },
      orderBy: [{ blockOrder: 'asc' }, { round: 'asc' }, { order: 'asc' }],
      include: setWithExerciseInclude,
    });
  }

  findRecords(userId: string, exerciseIds: string[]): Promise<PersonalRecord[]> {
    if (exerciseIds.length === 0) return Promise.resolve([]);
    return this.db.personalRecord.findMany({ where: { userId, exerciseId: { in: exerciseIds } } });
  }

  upsertRecord(record: RecordUpsert): Promise<PersonalRecord> {
    const { userId, exerciseId, metric, ...rest } = record;
    return this.db.personalRecord.upsert({
      where: { userId_exerciseId_metric: { userId, exerciseId, metric } },
      create: { userId, exerciseId, metric, ...rest },
      update: rest,
    });
  }
}
