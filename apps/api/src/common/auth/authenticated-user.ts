import type { UserRole } from '@tlc/shared';

/** Utilizador autenticado, anexado a `req.user` pelo guard global. */
export interface AuthenticatedUser {
  id: string;
  authId: string;
  email: string;
  locale: string;
  timezone: string;
  role: UserRole;
}

/** Claims relevantes extraídas de um JWT do Supabase Auth. */
export interface AuthClaims {
  /** auth.users.id */
  sub: string;
  email: string | null;
  displayName: string | null;
}
