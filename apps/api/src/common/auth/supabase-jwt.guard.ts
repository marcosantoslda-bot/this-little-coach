import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { z } from 'zod';
import type { Env } from '../../config/env';
import { unauthorized } from '../errors/api-errors';
import { UsersService } from '../../modules/users/users.service';
import type { AuthenticatedUser } from './authenticated-user';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TokenVerifierService } from './token-verifier.service';

export const DEV_USER_HEADER = 'x-dev-user-email';
const emailSchema = z.string().trim().toLowerCase().email();

type AuthRequest = Request & { user?: AuthenticatedUser };

/**
 * Guard global (APP_GUARD). Aceita `Authorization: Bearer <jwt do Supabase>`,
 * carrega/cria o utilizador local por `authId` e coloca-o em `req.user`.
 *
 * Bypass de desenvolvimento: com NODE_ENV != 'production' e AUTH_DEV_BYPASS=true,
 * o cabeçalho `x-dev-user-email: alguem@example.com` autentica (e cria) esse
 * utilizador sem Supabase. Nunca fica ativo em produção (validado em env.ts).
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly devBypassEnabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifierService,
    private readonly users: UsersService,
    config: ConfigService<Env, true>,
  ) {
    this.devBypassEnabled =
      config.get('AUTH_DEV_BYPASS', { infer: true }) && config.get('NODE_ENV', { infer: true }) !== 'production';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();

    const devUser = await this.tryDevBypass(request);
    if (devUser) {
      request.user = devUser;
      return true;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw unauthorized('Falta o cabeçalho Authorization: Bearer <token>', 'MISSING_TOKEN');
    }

    const claims = await this.verifier.verify(token);
    request.user = await this.users.resolveFromClaims(claims);
    return true;
  }

  private async tryDevBypass(request: AuthRequest): Promise<AuthenticatedUser | null> {
    if (!this.devBypassEnabled) return null;
    const raw = request.headers[DEV_USER_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return null;
    const parsed = emailSchema.safeParse(value);
    if (!parsed.success) {
      throw unauthorized(`Cabeçalho ${DEV_USER_HEADER} inválido`, 'INVALID_DEV_USER');
    }
    return this.users.resolveDevUser(parsed.data);
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}
