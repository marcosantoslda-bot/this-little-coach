import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../../modules/users/users.module';
import { SupabaseJwtGuard } from './supabase-jwt.guard';
import { TokenVerifierService } from './token-verifier.service';

/** Regista o guard de autenticação globalmente. */
@Module({
  imports: [UsersModule],
  providers: [TokenVerifierService, { provide: APP_GUARD, useClass: SupabaseJwtGuard }],
})
export class AuthModule {}
