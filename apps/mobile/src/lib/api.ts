import { z, type ZodType, type ZodTypeDef } from 'zod';
import { supabase } from './supabase';

/** `T` é sempre o tipo de saída do schema (depois de defaults/transforms). */
type Schema<T> = ZodType<T, ZodTypeDef, unknown>;

/** Como apiErrorSchema (@tlc/shared), mas tolera `message` em array (ValidationPipe do Nest). */
const errorBodySchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** Sem rede / servidor inacessível (statusCode 0). */
  get isNetwork(): boolean {
    return this.statusCode === 0;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Mensagem curta para mostrar ao utilizador. */
export function errorMessage(e: unknown): string {
  if (isApiError(e)) {
    if (e.isNetwork) return 'Sem ligação. Verifica a rede e tenta de novo.';
    if (e.statusCode === 401) return 'Sessão expirada. Entra de novo.';
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Ocorreu um erro.';
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions<T> {
  body?: unknown;
  query?: Query;
  /** Schema Zod para validar a resposta. Sem schema, devolve `undefined`. */
  schema?: Schema<T>;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T = undefined>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (e) {
    throw new ApiError(0, e instanceof Error ? e.message : 'Sem ligação');
  }

  const text = await res.text();
  let json: unknown = undefined;
  if (text.length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  if (!res.ok) {
    const parsed = errorBodySchema.safeParse(json);
    if (parsed.success) {
      const msg = Array.isArray(parsed.data.message) ? parsed.data.message.join(', ') : parsed.data.message;
      throw new ApiError(parsed.data.statusCode, msg, parsed.data.code, parsed.data.details);
    }
    throw new ApiError(res.status, res.statusText || `Erro ${res.status}`);
  }

  if (!options.schema) return undefined as T;
  const result = options.schema.safeParse(json);
  if (!result.success) {
    throw new ApiError(500, 'Resposta inesperada da API', 'INVALID_RESPONSE', result.error.flatten());
  }
  return result.data;
}

export const api = {
  get: <T>(path: string, schema: Schema<T>, query?: Query) => request<T>('GET', path, { schema, query }),
  post: <T = undefined>(path: string, body?: unknown, schema?: Schema<T>) =>
    request<T>('POST', path, { body, schema }),
  patch: <T = undefined>(path: string, body: unknown, schema?: Schema<T>) =>
    request<T>('PATCH', path, { body, schema }),
  put: <T = undefined>(path: string, body: unknown, schema?: Schema<T>) => request<T>('PUT', path, { body, schema }),
  delete: <T = undefined>(path: string, schema?: Schema<T>) => request<T>('DELETE', path, { schema }),
};
