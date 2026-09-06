import { Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type BodyMeasurement, type PersonalRecord, type ProgressOverview, upsertBodyMeasurementSchema,
  type UpsertBodyMeasurementInput,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ZodBody } from '../../common/zod/zod-body.decorator';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Resumo: semana atual, sequência, peso, recordes recentes' })
  overview(@CurrentUser() user: AuthenticatedUser): Promise<ProgressOverview> {
    return this.progress.overview(user);
  }

  @Get('measurements')
  @ApiOperation({ summary: 'Medições corporais dos últimos 90 dias' })
  listMeasurements(@CurrentUser() user: AuthenticatedUser): Promise<BodyMeasurement[]> {
    return this.progress.listMeasurements(user);
  }

  @Put('measurements')
  @ApiOperation({ summary: 'Registar/atualizar a medição manual de um dia' })
  upsertMeasurement(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(upsertBodyMeasurementSchema) body: UpsertBodyMeasurementInput,
  ): Promise<BodyMeasurement> {
    return this.progress.upsertMeasurement(user, body);
  }

  @Get('records')
  @ApiOperation({ summary: 'Recordes pessoais atuais' })
  listRecords(@CurrentUser() user: AuthenticatedUser): Promise<PersonalRecord[]> {
    return this.progress.listRecords(user);
  }
}
