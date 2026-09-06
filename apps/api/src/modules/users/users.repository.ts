import { Injectable } from '@nestjs/common';
import type { Prisma, Profile, User } from '@tlc/database';
import { PrismaService } from '../../infra/prisma/prisma.service';

export const userWithProfileInclude = { profile: true } satisfies Prisma.UserInclude;
export type UserWithProfileRow = Prisma.UserGetPayload<{ include: typeof userWithProfileInclude }>;

/** Campos editáveis do perfil (sem chaves nem timestamps). */
export type ProfileData = Omit<Prisma.ProfileUncheckedCreateInput, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export interface CreateUserData {
  authId: string;
  email: string;
  displayName: string;
  locale?: string;
  timezone?: string;
}

/** Acesso a dados de utilizadores e perfis (só Prisma, sem regras de negócio). */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAuthId(authId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { authId } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByIdWithProfile(id: string): Promise<UserWithProfileRow | null> {
    return this.prisma.user.findUnique({ where: { id }, include: userWithProfileInclude });
  }

  findProfile(userId: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { userId } });
  }

  createWithProfile(data: CreateUserData): Promise<UserWithProfileRow> {
    return this.prisma.user.create({
      data: { ...data, profile: { create: {} } },
      include: userWithProfileInclude,
    });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput): Promise<UserWithProfileRow> {
    return this.prisma.user.update({ where: { id }, data, include: userWithProfileInclude });
  }

  /** Cria o perfil se ainda não existir (utilizadores antigos) e aplica as alterações. */
  upsertProfile(userId: string, data: ProfileData): Promise<Profile> {
    return this.prisma.profile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }

  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
