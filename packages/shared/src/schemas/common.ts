import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime({ offset: true });
/** Data sem hora, formato YYYY-MM-DD. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD');
export const localeSchema = z.enum(['pt-PT', 'en-US']);

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: uuidSchema.optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: uuidSchema.nullable(),
  });

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
