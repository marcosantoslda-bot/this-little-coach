import type { AuthError } from '@supabase/supabase-js';

/** Traduz as mensagens mais comuns do Supabase Auth para pt-PT. */
export function authErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return 'Ocorreu um erro.';
  const m = error.message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou palavra-passe incorretos.';
  if (m.includes('email not confirmed')) return 'Confirma o teu email antes de entrar.';
  if (m.includes('user already registered')) return 'Já existe uma conta com este email.';
  if (m.includes('password should be at least')) return 'A palavra-passe tem de ter pelo menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiadas tentativas. Espera um pouco.';
  if (m.includes('token has expired') || m.includes('otp expired')) return 'O código expirou. Pede um novo.';
  if (m.includes('invalid') && m.includes('otp')) return 'Código inválido.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Email inválido.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem ligação. Verifica a rede.';
  return error.message;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
