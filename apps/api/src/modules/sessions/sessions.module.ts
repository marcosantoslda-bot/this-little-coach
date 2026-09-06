import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { SessionsController } from './sessions.controller';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [WorkoutsModule, ProgressModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
