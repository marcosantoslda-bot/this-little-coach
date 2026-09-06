import { Controller, Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  completeOnboardingSchema, type CompleteOnboardingInput, type Me, updateProfileSchema, type UpdateProfileInput,
  updateUserSchema, type UpdateUserInput,
} from '@tlc/shared';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ZodBody } from '../../common/zod/zod-body.decorator';
import { UsersService } from './users.service';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Utilizador autenticado + perfil' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<Me> {
    return this.users.getMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar dados do utilizador (nome, avatar, locale, timezone)' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @ZodBody(updateUserSchema) body: UpdateUserInput): Promise<Me> {
    return this.users.updateMe(user.id, body);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Atualizar perfil de treino (parcial)' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @ZodBody(updateProfileSchema) body: UpdateProfileInput): Promise<Me> {
    return this.users.updateProfile(user.id, body);
  }

  @Post('onboarding')
  @HttpCode(200)
  @ApiOperation({ summary: 'Concluir onboarding (marca onboardingCompletedAt)' })
  completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(completeOnboardingSchema) body: CompleteOnboardingInput,
  ): Promise<Me> {
    return this.users.completeOnboarding(user.id, body);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar conta (soft delete)' })
  deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.users.deleteMe(user.id);
  }
}
