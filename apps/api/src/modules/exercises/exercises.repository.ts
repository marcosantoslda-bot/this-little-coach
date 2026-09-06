import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tlc/database';
import type { ExerciseQuery } from '@tlc/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { exerciseInclude, type ExerciseRow } from './exercises.selectors';

export type ExerciseFilters = Pick<ExerciseQuery, 'search' | 'category' | 'movementPattern' | 'muscle' | 'maxDifficulty'>;

export interface ExercisePage {
  /** Só ids maiores que este (ordenação por id). */
  cursor?: string;
  /** Quando omitido devolve todos os resultados a partir do cursor. */
  take?: number;
}

@Injectable()
export class ExercisesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: ExerciseFilters, page: ExercisePage): Promise<ExerciseRow[]> {
    return this.prisma.exercise.findMany({
      where: {
        isActive: true,
        ...(page.cursor ? { id: { gt: page.cursor } } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.movementPattern ? { movementPattern: filters.movementPattern } : {}),
        ...(filters.muscle ? { primaryMuscles: { has: filters.muscle } } : {}),
        ...(filters.maxDifficulty ? { difficulty: { lte: filters.maxDifficulty } } : {}),
        ...(filters.search ? { OR: searchClauses(filters.search) } : {}),
      },
      orderBy: { id: 'asc' },
      ...(page.take ? { take: page.take } : {}),
      include: exerciseInclude,
    });
  }

  findById(id: string): Promise<ExerciseRow | null> {
    return this.prisma.exercise.findUnique({ where: { id }, include: exerciseInclude });
  }

  /** Catálogo ativo completo — input do gerador de treinos. */
  findAllActive(): Promise<ExerciseRow[]> {
    return this.prisma.exercise.findMany({ where: { isActive: true }, orderBy: { slug: 'asc' }, include: exerciseInclude });
  }

  findActiveByIds(ids: string[]): Promise<ExerciseRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.exercise.findMany({ where: { id: { in: ids }, isActive: true }, include: exerciseInclude });
  }
}

function searchClauses(search: string): Prisma.ExerciseWhereInput[] {
  const contains = { contains: search, mode: 'insensitive' as const };
  return [
    { name: contains },
    { slug: { contains: search.toLowerCase().replace(/\s+/g, '-') } },
    { translations: { some: { name: contains } } },
  ];
}
