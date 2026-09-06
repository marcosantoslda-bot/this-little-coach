import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tlc/database';
import type { WorkoutQuery } from '@tlc/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { workoutFullInclude, type WorkoutFullRow, workoutSummaryInclude, type WorkoutSummaryRow } from './workouts.selectors';

export type WorkoutFilters = Pick<WorkoutQuery, 'source' | 'focus' | 'maxDurationMin'>;

@Injectable()
export class WorkoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Visíveis para o utilizador: SYSTEM publicados + os próprios (não arquivados). */
  private visibleTo(userId: string): Prisma.WorkoutWhereInput {
    return { isArchived: false, OR: [{ source: 'SYSTEM', isPublished: true }, { createdById: userId }] };
  }

  findManyVisible(userId: string, filters: WorkoutFilters, page: { cursor?: string; take: number }): Promise<WorkoutSummaryRow[]> {
    return this.prisma.workout.findMany({
      where: {
        ...this.visibleTo(userId),
        ...(filters.source ? { source: filters.source } : {}),
        ...(filters.focus ? { focus: filters.focus } : {}),
        ...(filters.maxDurationMin ? { estimatedDurationMin: { lte: filters.maxDurationMin } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: page.take,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
      include: workoutSummaryInclude,
    });
  }

  findVisibleById(id: string, userId: string): Promise<WorkoutFullRow | null> {
    return this.prisma.workout.findFirst({ where: { id, ...this.visibleTo(userId) }, include: workoutFullInclude });
  }

  create(data: Prisma.WorkoutUncheckedCreateInput): Promise<WorkoutFullRow> {
    return this.prisma.workout.create({ data, include: workoutFullInclude });
  }

  /** Arquiva um treino do próprio utilizador. Devolve quantos foram afetados (0 = não é dele). */
  async archiveOwn(id: string, userId: string): Promise<number> {
    const result = await this.prisma.workout.updateMany({ where: { id, createdById: userId }, data: { isArchived: true } });
    return result.count;
  }
}
