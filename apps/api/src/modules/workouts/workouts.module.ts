import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises/exercises.module';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from '../users/users.module';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsRepository } from './workouts.repository';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [ExercisesModule, UsersModule, ProgressModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutsRepository],
  exports: [WorkoutsRepository],
})
export class WorkoutsModule {}
