import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Exercise, exerciseQuerySchema, type ExerciseQuery } from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ZodParam, ZodQuery } from '../../common/zod/zod-body.decorator';
import { ExercisesService, type Paginated } from './exercises.service';

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de exercícios (localizado, filtrável, paginado por cursor)' })
  list(@CurrentUser() user: AuthenticatedUser, @ZodQuery(exerciseQuerySchema) query: ExerciseQuery): Promise<Paginated<Exercise>> {
    return this.exercises.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um exercício' })
  getById(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string): Promise<Exercise> {
    return this.exercises.getById(user, id);
  }
}
