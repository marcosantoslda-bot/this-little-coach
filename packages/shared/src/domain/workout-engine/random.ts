/**
 * Gerador de números pseudo-aleatórios determinístico (mulberry32).
 *
 * O motor de treinos tem de ser reprodutível: a mesma `seed` com os mesmos
 * inputs produz exatamente o mesmo treino. Por isso nunca usamos `Math.random`
 * — toda a aleatoriedade passa por aqui.
 */

/** Função que devolve um número em [0, 1). */
export type Rng = () => number;

/** Cria um gerador mulberry32 a partir de uma seed inteira (32 bits). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inteiro aleatório em [min, max] (inclusive). */
export function randomInt(rng: Rng, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

/** Escolhe um elemento; `undefined` se a lista estiver vazia. */
export function pickRandom<T>(rng: Rng, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/** Devolve uma cópia baralhada (Fisher–Yates) sem tocar no original. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}
