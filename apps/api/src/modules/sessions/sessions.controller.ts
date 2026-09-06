import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  completeSessionSchema, type CompleteSessionInput, logSetsSchema, type LogSetsInput, type Session,
  sessionQuerySchema, type SessionQuery, type SessionSummary, startSessionSchema, type StartSessionInput,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ZodBody, ZodParam, ZodQuery } from '../../common/zod/zod-body.decorator';
import type { Paginated } from '../exercises/exercises.service';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Iniciar sessão (com snapshot do treino, ou livre)' })
  start(@CurrentUser() user: AuthenticatedUser, @ZodBody(startSessionSchema) body: StartSessionInput): Promise<Session> {
    return this.sessions.start(user, body);
  }

  @Get()
  @ApiOperation({ summary: 'As minhas sessões, mais recentes primeiro' })
  list(@CurrentUser() user: AuthenticatedUser, @ZodQuery(sessionQuerySchema) query: SessionQuery): Promise<Paginated<SessionSummary>> {
    return this.sessions.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de uma sessão (snapshot + séries)' })
  getById(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string): Promise<Session> {
    return this.sessions.getById(user, id);
  }

  @Post(':id/sets')
  @HttpCode(200)
  @ApiOperation({ summary: 'Registar séries (batch, idempotente por id)' })
  logSets(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string, @ZodBody(logSetsSchema) body: LogSetsInput): Promise<Session> {
    return this.sessions.logSets(user, id, body);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Concluir sessão: feedback, calorias e recordes' })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @ZodParam('id') id: string,
    @ZodBody(completeSessionSchema) body: CompleteSessionInput,
  ): Promise<Session> {
    return this.sessions.complete(user, id, body);
  }

  @Post(':id/abandon')
  @HttpCode(200)
  @ApiOperation({ summary: 'Abandonar sessão a decorrer' })
  abandon(@CurrentUser() user: AuthenticatedUser, @ZodParam('id') id: string): Promise<Session> {
    return this.sessions.abandon(user, id);
  }
}
