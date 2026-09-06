import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BodyWeightService } from './body-weight.service';
import { ProgressController } from './progress.controller';
import { ProgressRepository } from './progress.repository';
import { ProgressService } from './progress.service';

@Module({
  imports: [UsersModule],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository, BodyWeightService],
  exports: [BodyWeightService],
})
export class ProgressModule {}
