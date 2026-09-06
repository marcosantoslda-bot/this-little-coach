import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyOptions } from 'jose';
import type { Env } from '../../config/env';
import { unauthorized } from '../errors/api-errors';
import type { AuthClaims } from './authenticated-user';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifica JWTs emitidos pelo Supabase Auth com `jose`:
 *  - HS256 com SUPABASE_JWT_SECRET quando definido;
 *  - caso contrário, chaves assimétricas via JWKS em `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 * Se SUPABASE_URL estiver definido, o `iss` do token também é validado.
 */
@Injectable()
export class TokenVerifierService {
  private readonly logger = new Logger(TokenVerifierService.name);
  private readonly secret: Uint8Array | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly issuer: string | null;

  constructor(config: ConfigService<Env, true>) {
    const secret = config.get('SUPABASE_JWT_SECRET', { infer: true });
    const supabaseUrl = config.get('SUPABASE_URL', { infer: true });

    this.secret = secret ? new TextEncoder().encode(secret) : null;
    this.issuer = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1` : null;
    this.jwks = !secret && supabaseUrl ? createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`)) : null;

    if (!this.secret && !this.jwks) {
      this.logger.warn('Sem SUPABASE_JWT_SECRET nem SUPABASE_URL: só o bypass de desenvolvimento funciona');
    }
  }

  async verify(token: string): Promise<AuthClaims> {
    const options: JWTVerifyOptions = {
      audience: 'authenticated',
      ...(this.issuer ? { issuer: this.issuer } : {}),
    };

    let payload: JWTPayload;
    try {
      if (this.secret) {
        ({ payload } = await jwtVerify(token, this.secret, { ...options, algorithms: ['HS256'] }));
      } else if (this.jwks) {
        ({ payload } = await jwtVerify(token, this.jwks, options));
      } else {
        throw unauthorized('Verificação de tokens não configurada', 'AUTH_NOT_CONFIGURED');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiHttpException') throw error;
      this.logger.debug(`Token rejeitado: ${error instanceof Error ? error.message : String(error)}`);
      throw unauthorized('Token inválido ou expirado', 'INVALID_TOKEN');
    }

    return toClaims(payload);
  }
}

export function toClaims(payload: JWTPayload): AuthClaims {
  const sub = payload.sub;
  if (!sub || !UUID_RE.test(sub)) {
    throw unauthorized('Token sem identificador de utilizador válido', 'INVALID_TOKEN');
  }
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  const metadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
  const fromMetadata = [metadata.full_name, metadata.name].find((v): v is string => typeof v === 'string' && v.trim().length > 0);
  const displayName = fromMetadata?.trim() ?? (email ? email.split('@')[0] ?? null : null);
  return { sub, email, displayName };
}
