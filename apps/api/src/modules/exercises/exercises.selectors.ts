import type { Prisma } from '@tlc/database';

/** Include padrão: traduções + grafo de progressões (para easierIds/harderIds). */
export const exerciseInclude = {
  translations: true,
  /** este exercício é a versão mais fácil de -> harderId */
  progressesTo: { select: { harderId: true } },
  /** este exercício é a versão mais difícil de -> easierId */
  regressesTo: { select: { easierId: true } },
} satisfies Prisma.ExerciseInclude;

export type ExerciseRow = Prisma.ExerciseGetPayload<{ include: typeof exerciseInclude }>;
