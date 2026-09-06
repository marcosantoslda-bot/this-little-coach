import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@tlc/database';
import { generateWorkout, type GeneratedWorkout } from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type { ExercisesRepository } from '../exercises/exercises.repository';
import type { ExerciseRow } from '../exercises/exercises.selectors';
import type { BodyWeightService } from '../progress/body-weight.service';
import type { UsersRepository } from '../users/users.repository';
import type { WorkoutsRepository } from '../workouts/workouts.repository';
import type { WorkoutFullRow } from './workouts.selectors';
import { WorkoutsService } from './workouts.service';

vi.mock('../../infra/prisma/prisma.service', () => ({ PrismaService: class {} }));
vi.mock('@tlc/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tlc/shared')>();
  return { ...actual, generateWorkout: vi.fn() };
});

const USER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  authId: '22222222-2222-4222-8222-222222222222',
  email: 'ana@example.com',
  locale: 'pt-PT',
  timezone: 'Europe/Lisbon',
  role: 'MEMBER',
};
const PUSH_UP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const KNEE_PUSH_UP_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SQUAT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const WORKOUT_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const decimal = (n: number) => n as unknown as Prisma.Decimal;

function exerciseRow(partial: Partial<ExerciseRow> & { id: string; slug: string; name: string }): ExerciseRow {
  return {
    category: 'STRENGTH',
    movementPattern: 'PUSH_HORIZONTAL',
    primaryMuscles: ['CHEST'],
    secondaryMuscles: ['TRICEPS'],
    equipment: ['NONE'],
    difficulty: 2,
    metric: 'REPS',
    isUnilateral: false,
    metValue: decimal(8),
    defaultTempo: null,
    thumbnailUrl: null,
    videoUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [{ id: 't', exerciseId: partial.id, locale: 'pt-PT', name: `${partial.name} (pt)`, description: null, cues: ['core ativo'] }],
    progressesTo: [],
    regressesTo: [],
    ...partial,
  } as ExerciseRow;
}

const catalog: ExerciseRow[] = [
  exerciseRow({ id: PUSH_UP_ID, slug: 'push-up', name: 'Push-up', regressesTo: [{ easierId: KNEE_PUSH_UP_ID }] }),
  exerciseRow({ id: KNEE_PUSH_UP_ID, slug: 'knee-push-up', name: 'Knee push-up', difficulty: 1, progressesTo: [{ harderId: PUSH_UP_ID }] }),
  exerciseRow({ id: SQUAT_ID, slug: 'goblet-squat', name: 'Goblet squat', movementPattern: 'SQUAT', primaryMuscles: ['QUADS', 'GLUTES'], equipment: ['DUMBBELLS'], difficulty: 3, metValue: decimal(6) }),
];

const profile = {
  id: 'p', userId: USER.id, sex: null, birthDate: null, heightCm: null, startingWeightKg: 72.5, targetWeightKg: null, bodyFatPct: null,
  goal: 'LOSE_FAT', fitnessLevel: 'INTERMEDIATE', focus: 'LOWER_BODY_GLUTES', trainingDaysPerWeek: 4, preferredSessionMinutes: 30,
  preferredLocation: 'HOME', availableEquipment: ['MAT', 'DUMBBELLS'], activeMode: 'NORMAL', restrictedMuscles: ['LOWER_BACK'],
  limitationsNote: null, onboardingCompletedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
};

const generated: GeneratedWorkout = {
  name: 'Pernas e glúteos — 30 min',
  description: 'Circuito equilibrado',
  focus: 'LOWER_BODY',
  difficulty: 3,
  estimatedDurationMin: 30,
  requiredEquipment: ['DUMBBELLS'],
  blocks: [
    {
      order: 0, type: 'WARMUP', format: 'CIRCUIT', name: 'Aquecimento', rounds: 1, timeCapSec: null,
      restBetweenExercisesSec: 0, restBetweenRoundsSec: 0, notes: null,
      exercises: [{ exerciseId: KNEE_PUSH_UP_ID, order: 0, targetReps: 10, targetDurationSec: null, targetDistanceM: null, targetLoadKg: null, restAfterSec: null, tempo: null, notes: null }],
    },
    {
      order: 1, type: 'MAIN', format: 'STRAIGHT_SETS', name: null, rounds: 3, timeCapSec: null,
      restBetweenExercisesSec: 30, restBetweenRoundsSec: 60, notes: null,
      exercises: [
        { exerciseId: SQUAT_ID, order: 0, targetReps: 12, targetDurationSec: null, targetDistanceM: null, targetLoadKg: 12, restAfterSec: 45, tempo: '2-0-1-0', notes: null },
        { exerciseId: PUSH_UP_ID, order: 1, targetReps: 10, targetDurationSec: null, targetDistanceM: null, targetLoadKg: null, restAfterSec: null, tempo: null, notes: null },
      ],
    },
  ],
  explanation: ['Foco em pernas e glúteos porque é a tua preferência.', 'Sem exercícios que carreguem a lombar.'],
  generatorVersion: '1.0.0',
  generationInput: {
    profile: { fitnessLevel: 'INTERMEDIATE', goal: 'LOSE_FAT', focus: 'LOWER_BODY_GLUTES', restrictedMuscles: ['LOWER_BACK'], activeMode: 'NORMAL', bodyWeightKg: 72.5 },
    availableMinutes: 30, energyLevel: 4, equipment: ['MAT', 'DUMBBELLS'], seed: 42,
  },
};

/** Simula o que o Prisma devolve depois de `create` com include completo. */
function rowFromCreateInput(data: Record<string, any>): WorkoutFullRow {
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const blocks = (data.blocks?.create ?? []).map((block: Record<string, any>, i: number) => ({
    id: `block-${i}`, workoutId: WORKOUT_ID, notes: null, ...block,
    exercises: (block.exercises?.create ?? []).map((ex: Record<string, any>, j: number) => ({
      id: `we-${i}-${j}`, blockId: `block-${i}`, ...ex, exercise: byId.get(ex.exerciseId),
    })),
  }));
  return { id: WORKOUT_ID, generationInput: null, generatorVersion: null, isPublished: false, isArchived: false, createdAt: new Date('2026-09-09T08:00:00Z'), updatedAt: new Date(), ...data, blocks } as WorkoutFullRow;
}

describe('WorkoutsService', () => {
  let workouts: { create: ReturnType<typeof vi.fn>; findVisibleById: ReturnType<typeof vi.fn>; findManyVisible: ReturnType<typeof vi.fn>; archiveOwn: ReturnType<typeof vi.fn> };
  let exercises: { findAllActive: ReturnType<typeof vi.fn>; findActiveByIds: ReturnType<typeof vi.fn> };
  let users: { findProfile: ReturnType<typeof vi.fn> };
  let bodyWeight: { resolve: ReturnType<typeof vi.fn> };
  let service: WorkoutsService;

  beforeEach(() => {
    vi.mocked(generateWorkout).mockReset();
    workouts = { create: vi.fn(async (data) => rowFromCreateInput(data)), findVisibleById: vi.fn(), findManyVisible: vi.fn(), archiveOwn: vi.fn() };
    exercises = { findAllActive: vi.fn(async () => catalog), findActiveByIds: vi.fn(async (ids: string[]) => catalog.filter((e) => ids.includes(e.id))) };
    users = { findProfile: vi.fn(async () => profile) };
    bodyWeight = { resolve: vi.fn(async () => 72.5) };
    service = new WorkoutsService(
      workouts as unknown as WorkoutsRepository,
      exercises as unknown as ExercisesRepository,
      users as unknown as UsersRepository,
      bodyWeight as unknown as BodyWeightService,
    );
  });

  describe('generate', () => {
    it('maps profile + catalog into engine params, persists the generated workout and returns it with the explanation', async () => {
      vi.mocked(generateWorkout).mockReturnValue(generated);

      const result = await service.generate(USER, { availableMinutes: 30, energyLevel: 4, seed: 42 });

      // Parâmetros do motor: perfil, equipamento do perfil por defeito, seed do input
      expect(generateWorkout).toHaveBeenCalledTimes(1);
      const [params, engineCatalog] = vi.mocked(generateWorkout).mock.calls[0]!;
      expect(params).toEqual({
        profile: { fitnessLevel: 'INTERMEDIATE', goal: 'LOSE_FAT', focus: 'LOWER_BODY_GLUTES', restrictedMuscles: ['LOWER_BACK'], activeMode: 'NORMAL', bodyWeightKg: 72.5 },
        availableMinutes: 30, energyLevel: 4, equipment: ['MAT', 'DUMBBELLS'], seed: 42,
      });
      expect(engineCatalog).toHaveLength(3);
      expect(engineCatalog.find((e) => e.id === PUSH_UP_ID)).toMatchObject({ slug: 'push-up', metValue: 8, easierIds: [KNEE_PUSH_UP_ID], harderIds: [] });
      expect(engineCatalog.find((e) => e.id === KNEE_PUSH_UP_ID)).toMatchObject({ easierIds: [], harderIds: [PUSH_UP_ID] });

      // Persistência: source GENERATED, explicação dentro de generationInput, blocos aninhados
      expect(workouts.create).toHaveBeenCalledTimes(1);
      const created = workouts.create.mock.calls[0]![0];
      expect(created).toMatchObject({
        source: 'GENERATED', createdById: USER.id, generatorVersion: '1.0.0', isPublished: false, name: generated.name,
        generationInput: { params: generated.generationInput, explanation: generated.explanation },
      });
      expect(created.blocks.create).toHaveLength(2);
      expect(created.blocks.create[1].exercises.create[0]).toMatchObject({ exerciseId: SQUAT_ID, order: 0, targetReps: 12, targetLoadKg: 12 });

      // Resposta: workoutSchema com explicação e exercícios localizados
      expect(result).toMatchObject({ id: WORKOUT_ID, source: 'GENERATED', explanation: generated.explanation, createdById: USER.id });
      expect(result.blocks[1]!.exercises[0]!.exercise).toMatchObject({ id: SQUAT_ID, name: 'Goblet squat (pt)', cues: ['core ativo'] });
      expect(result.blocks[1]!.exercises[0]!.targetLoadKg).toBe(12);
    });

    it('uses explicit equipment/focus from the input and generates a seed when omitted', async () => {
      vi.mocked(generateWorkout).mockReturnValue(generated);

      await service.generate(USER, { availableMinutes: 20, energyLevel: 2, equipment: ['NONE'], focus: 'CORE' });

      const [params] = vi.mocked(generateWorkout).mock.calls[0]!;
      expect(params.equipment).toEqual(['NONE']);
      expect(params.focus).toBe('CORE');
      expect(Number.isInteger(params.seed)).toBe(true);
    });

    it('returns 503 when the generator throws (still a stub today)', async () => {
      vi.mocked(generateWorkout).mockImplementation(() => {
        throw new Error('generateWorkout: not implemented yet');
      });

      await expect(service.generate(USER, { availableMinutes: 30, energyLevel: 3 })).rejects.toMatchObject({ status: 503 });
      expect(workouts.create).not.toHaveBeenCalled();
    });
  });

  describe('create (USER)', () => {
    it('rejects unknown exercises with 400', async () => {
      const unknown = '00000000-0000-4000-8000-000000000000';
      await expect(
        service.create(USER, {
          name: 'Meu treino', description: null, focus: 'FULL_BODY',
          blocks: [{ type: 'MAIN', format: 'STRAIGHT_SETS', name: null, rounds: 3, timeCapSec: null, restBetweenExercisesSec: 0, restBetweenRoundsSec: 60,
            exercises: [{ exerciseId: unknown, targetReps: 10, targetDurationSec: null, targetDistanceM: null, targetLoadKg: null, restAfterSec: null, tempo: null, notes: null }] }],
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(workouts.create).not.toHaveBeenCalled();
    });

    it('derives difficulty, equipment and duration from the exercises', async () => {
      const result = await service.create(USER, {
        name: 'Meu treino', description: null, focus: 'FULL_BODY',
        blocks: [{ type: 'MAIN', format: 'STRAIGHT_SETS', name: null, rounds: 3, timeCapSec: null, restBetweenExercisesSec: 0, restBetweenRoundsSec: 60,
          exercises: [
            { exerciseId: SQUAT_ID, targetReps: 10, targetDurationSec: null, targetDistanceM: null, targetLoadKg: null, restAfterSec: 30, tempo: null, notes: null },
            { exerciseId: PUSH_UP_ID, targetReps: 10, targetDurationSec: null, targetDistanceM: null, targetLoadKg: null, restAfterSec: 30, tempo: null, notes: null },
          ] }],
      });

      const created = workouts.create.mock.calls[0]![0];
      // (30 + 30) * 2 exercícios * 3 rondas + 2 * 60 = 480 s = 8 min ; dificuldade média (3 + 2) / 2 = 2.5 -> 3
      expect(created).toMatchObject({ source: 'USER', createdById: USER.id, estimatedDurationMin: 8, difficulty: 3, requiredEquipment: ['DUMBBELLS'] });
      expect(result.source).toBe('USER');
      expect(result.blocks[0]!.exercises.map((e) => e.order)).toEqual([0, 1]);
    });
  });

  it('archive: 404 when the workout is not owned by the user', async () => {
    workouts.archiveOwn.mockResolvedValue(0);
    await expect(service.archive(USER, WORKOUT_ID)).rejects.toMatchObject({ status: 404 });
  });
});
