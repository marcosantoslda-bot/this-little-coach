import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AuthModule } from './common/auth/auth.module';
import { LocalizationModule } from './common/localization/localization.module';
import { validateEnv } from './config/env';
import { HealthController } from './health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // .env local da API tem precedência sobre o .env da raiz do monorepo.
      envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
    }),
    PrismaModule,
    LocalizationModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    WorkoutsModule,
    SessionsModule,
    ProgressModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
