import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma, User } from '@tlc/database';
import type { CompleteOnboardingInput, Me, UpdateProfileInput, UpdateUserInput } from '@tlc/shared';
import type { AuthClaims, AuthenticatedUser } from '../../common/auth/authenticated-user';
import { notFound, unauthorized } from '../../common/errors/api-errors';
import { fromIsoDate } from '../../common/mapping/primitives';
import { toAuthenticatedUser, toMe } from './users.mapper';
import { UsersRepository } from './users.repository';

const DEFAULT_DISPLAY_NAME = 'Atleta';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly users: UsersRepository) {}

  // ---------------------------------------------------------------- auth

  /** Carrega (ou cria no primeiro login) o utilizador local a partir do JWT. */
  async resolveFromClaims(claims: AuthClaims): Promise<AuthenticatedUser> {
    const existing = await this.users.findByAuthId(claims.sub);
    if (existing) return this.toActive(existing);

    if (!claims.email) {
      throw unauthorized('O token não inclui email; impossível criar o utilizador', 'EMAIL_REQUIRED');
    }

    const sameEmail = await this.users.findByEmail(claims.email);
    if (sameEmail) {
      // A conta no Supabase foi recriada com o mesmo email: religa-se ao utilizador local.
      this.toActive(sameEmail);
      const relinked = await this.users.updateUser(sameEmail.id, { authId: claims.sub });
      this.logger.log(`Utilizador ${relinked.id} religado ao novo authId`);
      return toAuthenticatedUser(relinked);
    }

    const created = await this.users.createWithProfile({
      authId: claims.sub,
      email: claims.email,
      displayName: claims.displayName ?? DEFAULT_DISPLAY_NAME,
    });
    this.logger.log(`Novo utilizador ${created.id} (${created.email})`);
    return toAuthenticatedUser(created);
  }

  /** Bypass de desenvolvimento: utilizador identificado só pelo email. */
  async resolveDevUser(email: string): Promise<AuthenticatedUser> {
    const existing = await this.users.findByEmail(email);
    if (existing) return this.toActive(existing);
    const created = await this.users.createWithProfile({
      authId: randomUUID(),
      email,
      displayName: email.split('@')[0] ?? DEFAULT_DISPLAY_NAME,
    });
    return toAuthenticatedUser(created);
  }

  private toActive(row: User): AuthenticatedUser {
    if (row.deletedAt) throw unauthorized('Conta eliminada', 'ACCOUNT_DELETED');
    return toAuthenticatedUser(row);
  }

  // ----------------------------------------------------------------- /me

  async getMe(userId: string): Promise<Me> {
    const row = await this.users.findByIdWithProfile(userId);
    if (!row || row.deletedAt) throw notFound('Utilizador não encontrado', 'USER_NOT_FOUND');
    const profile = row.profile ?? (await this.users.upsertProfile(userId, {}));
    return toMe(row, profile);
  }

  async updateMe(userId: string, input: UpdateUserInput): Promise<Me> {
    await this.users.updateUser(userId, input);
    return this.getMe(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Me> {
    await this.users.upsertProfile(userId, toProfileData(input));
    return this.getMe(userId);
  }

  async completeOnboarding(userId: string, input: CompleteOnboardingInput): Promise<Me> {
    await this.users.upsertProfile(userId, { ...toProfileData(input), onboardingCompletedAt: new Date() });
    return this.getMe(userId);
  }

  async deleteMe(userId: string): Promise<void> {
    await this.users.softDelete(userId);
  }
}

/** Converte o input Zod (datas como string) em dados Prisma. */
export function toProfileData(input: UpdateProfileInput): Prisma.ProfileUncheckedUpdateInput {
  const { birthDate, ...rest } = input;
  return {
    ...rest,
    ...(birthDate !== undefined ? { birthDate: birthDate === null ? null : fromIsoDate(birthDate) } : {}),
  };
}
