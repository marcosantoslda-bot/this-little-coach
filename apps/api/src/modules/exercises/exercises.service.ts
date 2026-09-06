import { Injectable } from '@nestjs/common';
import type { Equipment, Exercise, ExerciseQuery } from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { notFound } from '../../common/errors/api-errors';
import { paginate } from '../../common/mapping/primitives';
import { toExercise } from './exercises.mapper';
import { ExercisesRepository } from './exercises.repository';
import type { ExerciseRow } from './exercises.selectors';

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

@Injectable()
export class ExercisesService {
  constructor(private readonly exercises: ExercisesRepository) {}

  async list(user: AuthenticatedUser, query: ExerciseQuery): Promise<Paginated<Exercise>> {
    const { limit, cursor, equipment, ...filters } = query;
    // O filtro "exequível com este equipamento" (subconjunto) não é exprimível
    // em Prisma sobre arrays; o catálogo é pequeno, por isso aplica-se em memória
    // a partir do cursor e só depois se corta a página.
    const rows = await this.exercises.findMany(filters, { cursor, take: equipment ? undefined : limit + 1 });
    const feasible = equipment ? rows.filter((row) => isFeasibleWith(row, equipment)) : rows;
    const page = paginate(feasible.slice(0, limit + 1), limit);
    return { items: page.items.map((row) => toExercise(row, user.locale)), nextCursor: page.nextCursor };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Exercise> {
    const row = await this.exercises.findById(id);
    if (!row) throw notFound('Exercício não encontrado', 'EXERCISE_NOT_FOUND');
    return toExercise(row, user.locale);
  }
}

/** Um exercício é exequível se todo o seu equipamento estiver disponível (NONE é sempre "disponível"). */
export function isFeasibleWith(exercise: Pick<ExerciseRow, 'equipment'>, available: readonly Equipment[]): boolean {
  const allowed = new Set<Equipment>([...available, 'NONE']);
  return exercise.equipment.every((item) => allowed.has(item));
}
