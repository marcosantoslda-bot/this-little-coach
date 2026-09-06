import { Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { Prisma } from '@tlc/database';
import {
  type CreateWorkoutInput, type GenerateWorkoutInput, type GenerateWorkoutParams, type GeneratedWorkout,
  generateWorkout, type Workout, type WorkoutQuery, type WorkoutSummary,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { badRequest, conflict, notFound, serviceUnavailable } from '../../common/errors/api-errors';
import { paginate } from '../../common/mapping/primitives';
import { toEngineExercise } from '../exercises/exercises.mapper';
import { ExercisesRepository } from '../exercises/exercises.repository';
import type { Paginated } from '../exercises/exercises.service';
import { BodyWeightService } from '../progress/body-weight.service';
import { UsersRepository } from '../users/users.repository';
import { aggregateDifficulty, aggregateEquipment, estimateWorkoutMinutes } from './workout-metrics';
import { type StoredGenerationInput, toWorkout, toWorkoutSummary } from './workouts.mapper';
import { WorkoutsRepository } from './workouts.repository';

const MAX_SEED = 2 ** 31 - 1;

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(
    private readonly workouts: WorkoutsRepository,
    private readonly exercises: ExercisesRepository,
    private readonly users: UsersRepository,
    private readonly bodyWeight: BodyWeightService,
  ) {}

  async list(user: AuthenticatedUser, query: WorkoutQuery): Promise<Paginated<WorkoutSummary>> {
    const { limit, cursor, ...filters } = query;
    const rows = await this.workouts.findManyVisible(user.id, filters, { cursor, take: limit + 1 });
    const page = paginate(rows, limit);
    return { items: page.items.map(toWorkoutSummary), nextCursor: page.nextCursor };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Workout> {
    const row = await this.workouts.findVisibleById(id, user.id);
    if (!row) throw notFound('Treino não encontrado', 'WORKOUT_NOT_FOUND');
    return toWorkout(row, user.locale);
  }

  /** Treino criado manualmente (source USER). */
  async create(user: AuthenticatedUser, input: CreateWorkoutInput): Promise<Workout> {
    const exerciseIds = [...new Set(input.blocks.flatMap((block) => block.exercises.map((e) => e.exerciseId)))];
    const catalog = await this.exercises.findActiveByIds(exerciseIds);
    const byId = new Map(catalog.map((row) => [row.id, row]));
    const missing = exerciseIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw badRequest('Exercício desconhecido ou inativo', 'UNKNOWN_EXERCISE', { exerciseIds: missing });
    }

    const used = exerciseIds.map((id) => byId.get(id)!);
    const row = await this.workouts.create({
      name: input.name,
      description: input.description,
      focus: input.focus,
      difficulty: aggregateDifficulty(used.map((e) => e.difficulty)),
      estimatedDurationMin: estimateWorkoutMinutes(input.blocks),
      requiredEquipment: aggregateEquipment(used.map((e) => e.equipment)),
      source: 'USER',
      createdById: user.id,
      isPublished: false,
      blocks: {
        create: input.blocks.map((block, blockOrder) => ({
          order: blockOrder,
          type: block.type,
          format: block.format,
          name: block.name,
          rounds: block.rounds,
          timeCapSec: block.timeCapSec,
          restBetweenExercisesSec: block.restBetweenExercisesSec,
          restBetweenRoundsSec: block.restBetweenRoundsSec,
          exercises: { create: block.exercises.map((exercise, order) => ({ order, ...exercise })) },
        })),
      },
    });
    return toWorkout(row, user.locale);
  }

  /** "Treino de hoje": perfil + catálogo -> gerador puro -> persistência (source GENERATED). */
  async generate(user: AuthenticatedUser, input: GenerateWorkoutInput): Promise<Workout> {
    const profile = await this.users.findProfile(user.id);
    if (!profile) throw conflict('Perfil em falta; completa o onboarding primeiro', 'PROFILE_MISSING');

    const [catalogRows, bodyWeightKg] = await Promise.all([this.exercises.findAllActive(), this.bodyWeight.resolve(user.id)]);

    const params: GenerateWorkoutParams = {
      profile: {
        fitnessLevel: profile.fitnessLevel,
        goal: profile.goal,
        focus: profile.focus,
        restrictedMuscles: profile.restrictedMuscles,
        activeMode: profile.activeMode,
        bodyWeightKg,
      },
      availableMinutes: input.availableMinutes,
      energyLevel: input.energyLevel,
      equipment: input.equipment ?? profile.availableEquipment,
      ...(input.focus ? { focus: input.focus } : {}),
      seed: input.seed ?? randomInt(0, MAX_SEED),
    };

    const generated = this.runGenerator(params, catalogRows.map(toEngineExercise));
    const row = await this.workouts.create(toGeneratedCreateInput(generated, user.id));
    return toWorkout(row, user.locale);
  }

  async archive(user: AuthenticatedUser, id: string): Promise<void> {
    const affected = await this.workouts.archiveOwn(id, user.id);
    if (affected === 0) throw notFound('Treino não encontrado', 'WORKOUT_NOT_FOUND');
  }

  private runGenerator(params: GenerateWorkoutParams, catalog: ReturnType<typeof toEngineExercise>[]): GeneratedWorkout {
    try {
      return generateWorkout(params, catalog);
    } catch (error) {
      this.logger.error(`Gerador falhou: ${error instanceof Error ? error.message : String(error)}`);
      throw serviceUnavailable('Gerador de treinos indisponível', 'GENERATOR_UNAVAILABLE');
    }
  }
}

export function toGeneratedCreateInput(generated: GeneratedWorkout, userId: string): Prisma.WorkoutUncheckedCreateInput {
  const stored: StoredGenerationInput = { params: generated.generationInput, explanation: generated.explanation };
  return {
    name: generated.name,
    description: generated.description,
    focus: generated.focus,
    difficulty: generated.difficulty,
    estimatedDurationMin: generated.estimatedDurationMin,
    requiredEquipment: generated.requiredEquipment,
    source: 'GENERATED',
    createdById: userId,
    generationInput: stored as unknown as Prisma.InputJsonValue,
    generatorVersion: generated.generatorVersion,
    isPublished: false,
    blocks: {
      create: generated.blocks.map((block) => ({
        order: block.order,
        type: block.type,
        format: block.format,
        name: block.name,
        rounds: block.rounds,
        timeCapSec: block.timeCapSec,
        restBetweenExercisesSec: block.restBetweenExercisesSec,
        restBetweenRoundsSec: block.restBetweenRoundsSec,
        notes: block.notes,
        exercises: {
          create: block.exercises.map((exercise) => ({
            order: exercise.order,
            exerciseId: exercise.exerciseId,
            targetReps: exercise.targetReps,
            targetDurationSec: exercise.targetDurationSec,
            targetDistanceM: exercise.targetDistanceM,
            targetLoadKg: exercise.targetLoadKg,
            restAfterSec: exercise.restAfterSec,
            tempo: exercise.tempo,
            notes: exercise.notes,
          })),
        },
      })),
    },
  };
}
