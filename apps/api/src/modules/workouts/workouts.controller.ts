import { Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createWorkoutSchema, type CreateWorkoutInput, generateWorkoutSchema, type GenerateWorkoutInput, type Workout,
  workoutQuerySchema, type WorkoutQuery, type WorkoutSummary,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ZodBody, ZodParam, ZodQuery } from '../../common/zod/zod-body.decorator';
import type { Paginated } from '../exercises/exercises.service';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@ApiBearerAuth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get()
  @ApiOperation({ summary: 'Treinos visíveis (SYSTEM publicados + os meus), mais recentes primeiro' })
  list(@CurrentUser() user: AuthenticatedUser, @ZodQuery(workoutQuerySchema) query: WorkoutQuery): Promise<Paginated<WorkoutSummary>> {
    return this.workouts.list(user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar treino manualmente (source USER)' })
  create(@CurrentUser() user: AuthenticatedUser, @ZodBody(createWorkoutSchema) body: CreateWorkoutInput): Promise<Workout> {
    return this.workouts.create(user, body);
  }

  @Post('generate')
  @HttpCode(201)
  @ApiOperation({ summary: 'Gerar o "treino de hoje" (source GENERATED) e persistir' })
  generate(@CurrentUser() user: AuthenticatedUser, @ZodBody(generateWorkoutSchema) body: GenerateWorkoutInput): Promise<Workout> {
    return this.workouts.generate(user, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Treino completo (blocos + exercícios localizados)' })
  getById(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string): Promise<Workout> {
    return this.workouts.getById(user, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Arquivar um treino meu' })
  archive(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string): Promise<void> {
    return this.workouts.archive(user, id);
  }
}
