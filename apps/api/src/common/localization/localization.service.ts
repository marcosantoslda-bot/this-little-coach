import { Injectable } from '@nestjs/common';
import { localizeExercise, pickTranslation, type LocalizedExerciseText, type Translatable } from './localization';

/** Fachada injetável sobre as funções puras de localização. */
@Injectable()
export class LocalizationService {
  pickTranslation<T extends Translatable>(translations: readonly T[], locale: string): T | undefined {
    return pickTranslation(translations, locale);
  }

  localizeExercise(exercise: Parameters<typeof localizeExercise>[0], locale: string): LocalizedExerciseText {
    return localizeExercise(exercise, locale);
  }
}
