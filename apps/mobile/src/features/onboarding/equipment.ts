import type { Equipment } from '@tlc/shared';

/** "Sem equipamento" é exclusivo: escolher outro remove-o, e vice-versa. Nunca fica vazio. */
export function normalizeEquipment(previous: Equipment[], next: Equipment[]): Equipment[] {
  const added = next.find((e) => !previous.includes(e));
  if (added === 'NONE') return ['NONE'];
  const withoutNone = next.filter((e) => e !== 'NONE');
  if (withoutNone.length === 0) return ['NONE'];
  return withoutNone;
}
