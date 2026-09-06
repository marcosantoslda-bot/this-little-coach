import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tlc/database';
import {
  type CompleteSessionInput, estimateSessionCalories, type LogSetsInput, type Session, type SessionQuery,
  type SessionSummary, type StartSessionInput,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { conflict, notFound } from '../../common/errors/api-errors';
import { localizeExercise } from '../../common/localization/localization';
import { paginate, toNumber } from '../../common/mapping/primitives';
import type { Paginated } from '../exercises/exercises.service';
import { BodyWeightService } from '../progress/body-weight.service';
import { SECONDS_PER_REP } from '../workouts/workout-metrics';
import { toWorkout } from '../workouts/workouts.mapper';
import { WorkoutsRepository } from '../workouts/workouts.repository';
import { collectRecordCandidates, recordKey, selectNewRecords } from './personal-records';
import { FREE_SESSION_SNAPSHOT, toSession, toSessionSummary, toWorkoutSnapshot, type WorkoutSnapshot } from './sessions.mapper';
import { SessionsRepository } from './sessions.repository';
import type { SessionRow, SetWithExerciseRow } from './sessions.selectors';

/** Peso usado nas calorias quando o utilizador ainda não registou nenhum. */
export const DEFAULT_BODY_WEIGHT_KG = 70;

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly workouts: WorkoutsRepository,
    private readonly bodyWeight: BodyWeightService,
  ) {}

  async start(user: AuthenticatedUser, input: StartSessionInput): Promise<Session> {
    let snapshot: WorkoutSnapshot = FREE_SESSION_SNAPSHOT;
    if (input.workoutId) {
      const workout = await this.workouts.findVisibleById(input.workoutId, user.id);
      if (!workout) throw notFound('Treino não encontrado', 'WORKOUT_NOT_FOUND');
      snapshot = toWorkoutSnapshot(toWorkout(workout, user.locale));
    }

    const row = await this.sessions.create({
      userId: user.id,
      workoutId: input.workoutId,
      workoutSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      status: 'IN_PROGRESS',
      source: 'APP',
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      energyBefore: input.energyBefore,
    });
    return toSession(row, user.locale);
  }

  async list(user: AuthenticatedUser, query: SessionQuery): Promise<Paginated<SessionSummary>> {
    const { limit, cursor, ...filters } = query;
    const rows = await this.sessions.findManyOwn(user.id, filters, { cursor, take: limit + 1 });
    const page = paginate(rows, limit);
    return { items: page.items.map(toSessionSummary), nextCursor: page.nextCursor };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Session> {
    return toSession(await this.requireOwn(user, id), user.locale);
  }

  /** Regista séries (idempotente por id). Só em sessões a decorrer. */
  async logSets(user: AuthenticatedUser, id: string, input: LogSetsInput): Promise<Session> {
    const session = await this.requireOwn(user, id);
    requireInProgress(session);
    const updated = await this.sessions.runInTransaction(async (tx) => {
      await tx.upsertSets(id, input.sets);
      return tx.findOwnById(id, user.id);
    });
    return toSession(updated ?? session, user.locale);
  }

  /** Fecha a sessão: séries pendentes, feedback, calorias e recordes — tudo na mesma transação. */
  async complete(user: AuthenticatedUser, id: string, input: CompleteSessionInput): Promise<Session> {
    const session = await this.requireOwn(user, id);
    requireInProgress(session);

    const weightKg = (await this.bodyWeight.resolve(user.id)) ?? DEFAULT_BODY_WEIGHT_KG;
    const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();

    return this.sessions.runInTransaction(async (tx) => {
      if (input.sets?.length) await tx.upsertSets(id, input.sets);
      const sets = await tx.findSetsWithExercise(id);

      const estimatedCalories = estimateSessionCalories(
        sets.filter((set) => !set.skipped).map((set) => ({
          metValue: toNumber(set.exercise.metValue),
          weightKg,
          durationSec: effortSeconds(set),
        })),
      );

      const newRecords = await this.updateRecords(tx, user, id, sets);

      const row = await tx.update(id, {
        status: 'COMPLETED',
        completedAt,
        durationSec: input.durationSec,
        rpe: input.rpe,
        moodAfter: input.moodAfter,
        rating: input.rating,
        notes: input.notes,
        estimatedCalories,
      });
      return { ...toSession(row, user.locale), newRecords };
    });
  }

  async abandon(user: AuthenticatedUser, id: string): Promise<Session> {
    const session = await this.requireOwn(user, id);
    requireInProgress(session);
    const row = await this.sessions.update(id, { status: 'ABANDONED', completedAt: new Date() });
    return toSession(row, user.locale);
  }

  private async requireOwn(user: AuthenticatedUser, id: string): Promise<SessionRow> {
    const session = await this.sessions.findOwnById(id, user.id);
    if (!session) throw notFound('Sessão não encontrada', 'SESSION_NOT_FOUND');
    return session;
  }

  private async updateRecords(
    tx: SessionsRepository,
    user: AuthenticatedUser,
    sessionId: string,
    sets: SetWithExerciseRow[],
  ): Promise<Session['newRecords']> {
    const candidates = collectRecordCandidates(sets);
    if (candidates.length === 0) return [];

    const existingRows = await tx.findRecords(user.id, [...new Set(candidates.map((c) => c.exerciseId))]);
    const existing = new Map(existingRows.map((r) => [recordKey(r.exerciseId, r.metric), toNumber(r.value)]));
    const exerciseById = new Map(sets.map((set) => [set.exerciseId, set.exercise]));

    const newRecords: Session['newRecords'] = [];
    for (const record of selectNewRecords(candidates, existing)) {
      await tx.upsertRecord({ userId: user.id, sessionId, ...record });
      const exercise = exerciseById.get(record.exerciseId);
      newRecords.push({
        exerciseId: record.exerciseId,
        exerciseName: exercise ? localizeExercise(exercise, user.locale).name : record.exerciseId,
        metric: record.metric,
        value: record.value,
      });
    }
    return newRecords;
  }
}

function requireInProgress(session: SessionRow): void {
  if (session.status !== 'IN_PROGRESS') {
    throw conflict('A sessão já não está a decorrer', 'SESSION_NOT_IN_PROGRESS', { status: session.status });
  }
}

/** Tempo sob esforço de uma série: duração registada, senão repetições × 3 s. */
export function effortSeconds(set: { durationSec: number | null; repsCompleted: number | null }): number {
  if (set.durationSec) return set.durationSec;
  if (set.repsCompleted) return set.repsCompleted * SECONDS_PER_REP;
  return 0;
}
