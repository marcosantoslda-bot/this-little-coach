import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionSet } from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { ApiHttpException } from '../../common/errors/api-errors';
import type { WorkoutsRepository } from '../workouts/workouts.repository';
import type { BodyWeightService } from '../progress/body-weight.service';
import type { SessionsRepository } from './sessions.repository';
import type { SessionRow, SetWithExerciseRow } from './sessions.selectors';
import { DEFAULT_BODY_WEIGHT_KG, SessionsService } from './sessions.service';

vi.mock('../../infra/prisma/prisma.service', () => ({ PrismaService: class {} }));

const USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  authId: '22222222-2222-4222-8222-222222222222',
  email: 'ana@example.com',
  locale: 'pt-PT',
  timezone: 'Europe/Lisbon',
  role: 'MEMBER',
};
const OTHER_USER: AuthenticatedUser = { ...USER, id: '99999999-9999-4999-8999-999999999999', email: 'x@example.com' };

const SESSION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PUSH_UP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PLANK_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SQUAT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const pushUp = { id: PUSH_UP_ID, name: 'Push-up', metValue: 8, translations: [{ id: 't1', exerciseId: PUSH_UP_ID, locale: 'pt-PT', name: 'Flexão', description: null, cues: [] }] };
const plank = { id: PLANK_ID, name: 'Plank', metValue: 4, translations: [] };
const squat = { id: SQUAT_ID, name: 'Goblet squat', metValue: 6, translations: [] };

function sessionRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: SESSION_ID,
    userId: USER.id,
    workoutId: null,
    workoutSnapshot: { name: 'Treino livre', focus: 'FULL_BODY', difficulty: 1, estimatedDurationMin: 30, blocks: [] },
    status: 'IN_PROGRESS',
    source: 'APP',
    startedAt: new Date('2026-09-09T08:00:00Z'),
    completedAt: null,
    durationSec: null,
    energyBefore: 3,
    rpe: null,
    moodAfter: null,
    rating: null,
    notes: null,
    estimatedCalories: null,
    createdAt: new Date('2026-09-09T08:00:00Z'),
    updatedAt: new Date('2026-09-09T08:00:00Z'),
    sets: [],
    personalRecords: [],
    ...overrides,
  } as SessionRow;
}

function setRow(partial: Partial<SetWithExerciseRow> & { exercise: SetWithExerciseRow['exercise'] }): SetWithExerciseRow {
  return {
    id: crypto.randomUUID(),
    sessionId: SESSION_ID,
    exerciseId: partial.exercise.id,
    workoutExerciseId: null,
    blockOrder: 0,
    round: 1,
    order: 0,
    targetReps: null,
    targetDurationSec: null,
    repsCompleted: null,
    durationSec: null,
    distanceM: null,
    loadKg: null,
    rpe: null,
    skipped: false,
    adjustmentReason: 'NONE',
    substitutedFromId: null,
    completedAt: new Date('2026-09-09T08:10:00Z'),
    ...partial,
  } as SetWithExerciseRow;
}

function inputSet(partial: Partial<SessionSet> & { id: string; exerciseId: string }): SessionSet {
  return {
    workoutExerciseId: null,
    blockOrder: 0,
    round: 1,
    order: 0,
    targetReps: null,
    targetDurationSec: null,
    repsCompleted: null,
    durationSec: null,
    distanceM: null,
    loadKg: null,
    rpe: null,
    skipped: false,
    adjustmentReason: 'NONE',
    substitutedFromId: null,
    completedAt: '2026-09-09T08:10:00.000Z',
    ...partial,
  };
}

/** Repositório em memória: guarda séries por id (idempotência) e recordes por chave. */
function createRepo(session: SessionRow | null) {
  const sets = new Map<string, SessionSet>();
  const records = new Map<string, { exerciseId: string; metric: string; value: number }>();
  let current = session;

  const repo = {
    sets,
    records,
    runInTransaction: vi.fn(async (work: (repo: SessionsRepository) => Promise<unknown>) => work(repo as unknown as SessionsRepository)),
    findOwnById: vi.fn(async (id: string, userId: string) => (current && current.id === id && current.userId === userId ? current : null)),
    upsertSets: vi.fn(async (_sessionId: string, incoming: SessionSet[]) => {
      for (const set of incoming) sets.set(set.id, set);
    }),
    findSetsWithExercise: vi.fn(async (): Promise<SetWithExerciseRow[]> => []),
    findRecords: vi.fn(async () => [...records.values()].map((r) => ({ ...r, id: 'pr', userId: USER.id, sessionId: null, achievedAt: new Date() }))),
    upsertRecord: vi.fn(async (record: { exerciseId: string; metric: string; value: number }) => {
      records.set(`${record.exerciseId}:${record.metric}`, record);
      return record;
    }),
    update: vi.fn(async (_id: string, data: Partial<SessionRow>) => {
      current = { ...(current as SessionRow), ...data } as SessionRow;
      return current;
    }),
    create: vi.fn(),
    findManyOwn: vi.fn(),
  };
  return repo;
}

describe('SessionsService', () => {
  let workouts: { findVisibleById: ReturnType<typeof vi.fn> };
  let bodyWeight: { resolve: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    workouts = { findVisibleById: vi.fn() };
    bodyWeight = { resolve: vi.fn(async () => 80) };
  });

  const build = (repo: ReturnType<typeof createRepo>) =>
    new SessionsService(
      repo as unknown as SessionsRepository,
      workouts as unknown as WorkoutsRepository,
      bodyWeight as unknown as BodyWeightService,
    );

  describe('complete', () => {
    it('computes calories from MET x body weight x effort time and detects new records', async () => {
      const repo = createRepo(sessionRow());
      repo.records.set(`${PUSH_UP_ID}:MAX_REPS`, { exerciseId: PUSH_UP_ID, metric: 'MAX_REPS', value: 15 });
      repo.records.set(`${SQUAT_ID}:MAX_LOAD_KG`, { exerciseId: SQUAT_ID, metric: 'MAX_LOAD_KG', value: 12 });
      repo.findSetsWithExercise.mockResolvedValue([
        setRow({ exercise: pushUp, repsCompleted: 20 }), // 20 reps x 3 s = 60 s -> 8 * 3.5 * 80 / 200 * 1 = 11.2
        setRow({ exercise: pushUp, repsCompleted: 12, order: 1 }), // 36 s -> 6.72
        setRow({ exercise: plank, durationSec: 60, order: 2 }), // 4 * 3.5 * 80 / 200 * 1 = 5.6
        setRow({ exercise: squat, repsCompleted: 10, loadKg: 10, order: 3 }), // 30 s -> 4.2 ; load 10 < PR 12
        setRow({ exercise: plank, durationSec: 999, skipped: true, order: 4 }), // ignorada
      ]);
      const service = build(repo);

      const result = await service.complete(USER, SESSION_ID, {
        durationSec: 1500, rpe: 7, moodAfter: 4, rating: 5, notes: 'boa', completedAt: '2026-09-09T08:30:00.000Z',
      });

      // 11 + 7 + 6 + 4 (cada parcela arredondada por estimateCalories)
      expect(repo.update).toHaveBeenCalledWith(SESSION_ID, expect.objectContaining({
        status: 'COMPLETED', durationSec: 1500, rpe: 7, moodAfter: 4, rating: 5, notes: 'boa', estimatedCalories: 28,
        completedAt: new Date('2026-09-09T08:30:00.000Z'),
      }));
      expect(result.status).toBe('COMPLETED');
      expect(result.estimatedCalories).toBe(28);

      // Recordes: push-up 20 > 15 (novo), plank 60 s (sem recorde anterior), squat reps 10 (novo), squat carga 10 < 12 (não)
      expect(repo.upsertRecord).toHaveBeenCalledTimes(3);
      expect(repo.upsertRecord).toHaveBeenCalledWith(expect.objectContaining({ exerciseId: PUSH_UP_ID, metric: 'MAX_REPS', value: 20, sessionId: SESSION_ID, userId: USER.id }));
      expect(repo.upsertRecord).toHaveBeenCalledWith(expect.objectContaining({ exerciseId: PLANK_ID, metric: 'MAX_DURATION_SEC', value: 60 }));
      expect(repo.upsertRecord).toHaveBeenCalledWith(expect.objectContaining({ exerciseId: SQUAT_ID, metric: 'MAX_REPS', value: 10 }));
      expect(repo.upsertRecord).not.toHaveBeenCalledWith(expect.objectContaining({ metric: 'MAX_LOAD_KG' }));

      expect(result.newRecords).toEqual(expect.arrayContaining([
        { exerciseId: PUSH_UP_ID, exerciseName: 'Flexão', metric: 'MAX_REPS', value: 20 },
        { exerciseId: PLANK_ID, exerciseName: 'Plank', metric: 'MAX_DURATION_SEC', value: 60 },
      ]));
      expect(result.newRecords).toHaveLength(3);
      expect(repo.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('falls back to 70 kg when the user has no weight and upserts pending sets first', async () => {
      const repo = createRepo(sessionRow());
      bodyWeight.resolve.mockResolvedValue(null);
      repo.findSetsWithExercise.mockResolvedValue([setRow({ exercise: plank, durationSec: 120 })]);
      const service = build(repo);
      const pending = inputSet({ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', exerciseId: PLANK_ID, durationSec: 120 });

      await service.complete(USER, SESSION_ID, { durationSec: 600, rpe: null, moodAfter: null, rating: null, notes: null, sets: [pending] });

      expect(bodyWeight.resolve).toHaveBeenCalledWith(USER.id);
      expect(repo.upsertSets).toHaveBeenCalledWith(SESSION_ID, [pending]);
      // 4 MET * 3.5 * 70 / 200 * 2 min = 9.8 -> 10
      expect(repo.update).toHaveBeenCalledWith(SESSION_ID, expect.objectContaining({ estimatedCalories: 10 }));
      expect(DEFAULT_BODY_WEIGHT_KG).toBe(70);
    });

    it('returns 404 for a session owned by someone else', async () => {
      const repo = createRepo(sessionRow());
      const service = build(repo);

      await expect(
        service.complete(OTHER_USER, SESSION_ID, { durationSec: 100, rpe: null, moodAfter: null, rating: null, notes: null }),
      ).rejects.toMatchObject({ constructor: ApiHttpException, status: 404 });
      expect(repo.update).not.toHaveBeenCalled();
      expect(repo.runInTransaction).not.toHaveBeenCalled();
    });

    it('returns 409 when the session is no longer in progress', async () => {
      const repo = createRepo(sessionRow({ status: 'COMPLETED' }));
      const service = build(repo);

      await expect(
        service.complete(USER, SESSION_ID, { durationSec: 100, rpe: null, moodAfter: null, rating: null, notes: null }),
      ).rejects.toMatchObject({ status: 409 });
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('logSets', () => {
    it('is idempotent: re-sending a set with the same id updates instead of duplicating', async () => {
      const repo = createRepo(sessionRow());
      const service = build(repo);
      const setId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

      await service.logSets(USER, SESSION_ID, { sets: [inputSet({ id: setId, exerciseId: PUSH_UP_ID, repsCompleted: 10 })] });
      await service.logSets(USER, SESSION_ID, { sets: [inputSet({ id: setId, exerciseId: PUSH_UP_ID, repsCompleted: 12 })] });
      await service.logSets(USER, SESSION_ID, {
        sets: [
          inputSet({ id: setId, exerciseId: PUSH_UP_ID, repsCompleted: 12 }),
          inputSet({ id: '01234567-89ab-4cde-8f01-23456789abcd', exerciseId: PLANK_ID, durationSec: 45, order: 1 }),
        ],
      });

      expect(repo.sets.size).toBe(2);
      expect(repo.sets.get(setId)?.repsCompleted).toBe(12);
      expect(repo.runInTransaction).toHaveBeenCalledTimes(3);
    });

    it('rejects logging sets on a non-owned or finished session', async () => {
      const repo = createRepo(sessionRow({ status: 'ABANDONED' }));
      const service = build(repo);
      const set = inputSet({ id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', exerciseId: PUSH_UP_ID, repsCompleted: 10 });

      await expect(service.logSets(OTHER_USER, SESSION_ID, { sets: [set] })).rejects.toMatchObject({ status: 404 });
      await expect(service.logSets(USER, SESSION_ID, { sets: [set] })).rejects.toMatchObject({ status: 409 });
      expect(repo.upsertSets).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('creates a free session with an empty snapshot when no workout is given', async () => {
      const repo = createRepo(null);
      repo.create.mockImplementation(async (data: Record<string, unknown>) => sessionRow({ ...data, id: SESSION_ID } as Partial<SessionRow>));
      const service = build(repo);

      const session = await service.start(USER, { workoutId: null, energyBefore: 4, startedAt: '2026-09-09T08:00:00.000Z' });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: USER.id, workoutId: null, status: 'IN_PROGRESS', source: 'APP', energyBefore: 4,
        workoutSnapshot: expect.objectContaining({ name: 'Treino livre', blocks: [] }),
      }));
      expect(session.workout.blocks).toEqual([]);
      expect(session.startedAt).toBe('2026-09-09T08:00:00.000Z');
    });

    it('returns 404 when the workout is not visible to the user', async () => {
      const repo = createRepo(null);
      workouts.findVisibleById.mockResolvedValue(null);
      const service = build(repo);

      await expect(service.start(USER, { workoutId: SQUAT_ID, energyBefore: null })).rejects.toMatchObject({ status: 404 });
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});
