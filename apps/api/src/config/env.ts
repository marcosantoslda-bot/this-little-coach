import { z } from 'zod';

/**
 * Variáveis de ambiente da API, validadas com Zod no arranque.
 * Falha cedo (com mensagem legível) em vez de rebentar a meio de um pedido.
 */
const booleanString = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((v) => v === 'true' || v === '1');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    /** Ligação usada pela aplicação (pooler). */
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
    /** Ligação direta — só o Prisma Migrate precisa dela; opcional em runtime. */
    DIRECT_URL: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
    /** Segredo HS256 do Supabase Auth. Se ausente, usa-se o JWKS de SUPABASE_URL. */
    SUPABASE_JWT_SECRET: z.string().min(1).optional(),
    /** Fora de produção, permite autenticar com o cabeçalho `x-dev-user-email`. */
    AUTH_DEV_BYPASS: booleanString.default('false'),
    /** Origens CORS separadas por vírgula. Vazio = qualquer origem (dev). */
    CORS_ORIGINS: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const isProduction = env.NODE_ENV === 'production';
    if (isProduction && env.AUTH_DEV_BYPASS) {
      ctx.addIssue({ code: 'custom', path: ['AUTH_DEV_BYPASS'], message: 'não pode estar ativo em produção' });
    }
    const hasVerifier = Boolean(env.SUPABASE_JWT_SECRET || env.SUPABASE_URL);
    if (!hasVerifier && !(env.AUTH_DEV_BYPASS && !isProduction)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SUPABASE_JWT_SECRET'],
        message: 'define SUPABASE_JWT_SECRET ou SUPABASE_URL (ou AUTH_DEV_BYPASS=true fora de produção)',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || '(raiz)'}: ${i.message}`).join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${lines}`);
  }
  return result.data;
}
