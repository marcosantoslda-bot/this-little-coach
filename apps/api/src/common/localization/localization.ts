export const DEFAULT_LOCALE = 'en-US';

export interface Translatable {
  locale: string;
}

/**
 * Escolhe a tradução do `locale` pedido; se não existir, cai para en-US.
 * Devolve `undefined` quando não há tradução nenhuma (usa-se o nome canónico).
 */
export function pickTranslation<T extends Translatable>(translations: readonly T[], locale: string): T | undefined {
  return translations.find((t) => t.locale === locale) ?? translations.find((t) => t.locale === DEFAULT_LOCALE);
}

export interface LocalizedExerciseText {
  name: string;
  description: string | null;
  cues: string[];
}

export function localizeExercise(
  exercise: { name: string; translations: readonly { locale: string; name: string; description: string | null; cues: string[] }[] },
  locale: string,
): LocalizedExerciseText {
  const translation = pickTranslation(exercise.translations, locale);
  return {
    name: translation?.name ?? exercise.name,
    description: translation?.description ?? null,
    cues: translation?.cues ?? [],
  };
}
