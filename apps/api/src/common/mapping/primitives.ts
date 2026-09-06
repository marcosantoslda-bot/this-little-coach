/**
 * Conversões de primitivos Prisma -> contratos da API.
 * Decimal -> number, Date -> ISO 8601, Date (só data) -> YYYY-MM-DD.
 */
type DecimalLike = { toNumber(): number } | number | string;

export function toNumber(value: DecimalLike): number;
export function toNumber(value: DecimalLike | null | undefined): number | null;
export function toNumber(value: DecimalLike | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return value.toNumber();
}

export function toIso(value: Date): string;
export function toIso(value: Date | null | undefined): string | null;
export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Colunas `@db.Date` chegam como Date à meia-noite UTC. */
export function toIsoDate(value: Date): string;
export function toIsoDate(value: Date | null | undefined): string | null;
export function toIsoDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** YYYY-MM-DD -> Date à meia-noite UTC (para colunas `@db.Date`). */
export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Corta uma lista obtida com `take: limit + 1` e devolve o cursor seguinte. */
export function paginate<T extends { id: string }>(rows: T[], limit: number): { items: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? last.id : null };
}
