/**
 * Validação dos dados de seed. Corre antes de tocar na base de dados e nos testes.
 * Lança um Error com todas as falhas encontradas, ou devolve um resumo.
 */
import type { WorkoutFormat } from '@prisma/client';
import { EXERCISES, exercisesBySlug, isBodyweight } from './exercises';
import { SYSTEM_WORKOUTS } from './workouts';
import { buildProgressionPairs, estimateWorkoutDurationMin, minutesInName } from './derive';
import { SEED_LOCALES, type SeedExercise, type SeedWorkout } from './types';

export interface SeedValidationSummary {
  exercises: number;
  bodyweightExercises: number;
  progressions: number;
  workouts: number;
}

/** Formatos em que o alvo é o intervalo de tempo, mesmo para exercícios de REPS. */
const TIME_BOXED_FORMATS: ReadonlySet<WorkoutFormat> = new Set<WorkoutFormat>(['TABATA', 'EMOM', 'INTERVAL', 'AMRAP']);

/** Tolerância (min) entre a duração estimada e a anunciada no nome do treino. */
export const DURATION_TOLERANCE_MIN = 3;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function collectSeedErrors(exercises: SeedExercise[] = EXERCISES, workouts: SeedWorkout[] = SYSTEM_WORKOUTS): string[] {
  const errors: string[] = [];
  const bySlug = exercisesBySlug(exercises);

  // --- Exercícios ------------------------------------------------------------
  const seenSlugs = new Set<string>();
  for (const ex of exercises) {
    const where = `exercício "${ex.slug}"`;
    if (!SLUG_RE.test(ex.slug)) errors.push(`${where}: slug não é kebab-case`);
    if (seenSlugs.has(ex.slug)) errors.push(`${where}: slug duplicado`);
    seenSlugs.add(ex.slug);

    if (!ex.name.trim()) errors.push(`${where}: nome canónico vazio`);
    if (!Number.isInteger(ex.difficulty) || ex.difficulty < 1 || ex.difficulty > 5) {
      errors.push(`${where}: difficulty ${ex.difficulty} fora de 1–5`);
    }
    if (ex.primaryMuscles.length === 0) errors.push(`${where}: sem primaryMuscles`);
    if (ex.equipment.length === 0) errors.push(`${where}: equipment vazio (usa [NONE])`);
    if (ex.equipment.includes('NONE') && ex.equipment.length > 1) {
      errors.push(`${where}: NONE não pode coexistir com outro equipamento`);
    }
    if (ex.metValue != null && (ex.metValue <= 0 || ex.metValue > 30)) errors.push(`${where}: metValue implausível`);

    for (const locale of SEED_LOCALES) {
      const t = ex.translations[locale];
      if (!t) {
        errors.push(`${where}: falta tradução ${locale}`);
        continue;
      }
      if (!t.name.trim()) errors.push(`${where}: tradução ${locale} sem nome`);
      if (!t.description.trim()) errors.push(`${where}: tradução ${locale} sem descrição`);
      if (t.cues.length < 2 || t.cues.length > 3) errors.push(`${where}: tradução ${locale} deve ter 2–3 cues`);
      if (t.cues.some((c) => !c.trim())) errors.push(`${where}: tradução ${locale} com cue vazia`);
    }

    for (const other of [...ex.easier, ...(ex.harder ?? [])]) {
      if (other === ex.slug) errors.push(`${where}: progressão para si próprio`);
      else if (!bySlug.has(other)) errors.push(`${where}: progressão para slug inexistente "${other}"`);
    }
  }

  // Progressões contraditórias (A->B e B->A).
  const pairs = buildProgressionPairs(exercises);
  const pairKeys = new Set(pairs.map((p) => `${p.easier}=>${p.harder}`));
  for (const p of pairs) {
    if (pairKeys.has(`${p.harder}=>${p.easier}`)) errors.push(`progressão circular entre "${p.easier}" e "${p.harder}"`);
  }

  // --- Treinos ---------------------------------------------------------------
  const seenNames = new Set<string>();
  for (const w of workouts) {
    const where = `treino "${w.name}"`;
    if (seenNames.has(w.name)) errors.push(`${where}: nome duplicado`);
    seenNames.add(w.name);
    if (!Number.isInteger(w.difficulty) || w.difficulty < 1 || w.difficulty > 5) {
      errors.push(`${where}: difficulty ${w.difficulty} fora de 1–5`);
    }
    if (w.blocks.length === 0) errors.push(`${where}: sem blocos`);
    if (w.blocks[0]?.type !== 'WARMUP') errors.push(`${where}: o primeiro bloco deve ser WARMUP`);
    if (w.blocks[w.blocks.length - 1]?.type !== 'COOLDOWN') errors.push(`${where}: o último bloco deve ser COOLDOWN`);

    let missingSlug = false;
    w.blocks.forEach((block, bi) => {
      const bWhere = `${where}, bloco ${bi + 1} (${block.name ?? block.type})`;
      if (block.rounds < 1) errors.push(`${bWhere}: rounds < 1`);
      if (block.exercises.length === 0) errors.push(`${bWhere}: sem exercícios`);
      const timeBoxed = TIME_BOXED_FORMATS.has(block.format);
      if (block.format === 'TABATA' && block.timeCapSec == null) errors.push(`${bWhere}: TABATA precisa de timeCapSec`);

      block.exercises.forEach((entry, ei) => {
        const eWhere = `${bWhere}, exercício ${ei + 1} "${entry.slug}"`;
        const ex = bySlug.get(entry.slug);
        if (!ex) {
          errors.push(`${eWhere}: slug inexistente`);
          missingSlug = true;
          return;
        }
        const hasReps = entry.targetReps != null;
        const hasDuration = entry.targetDurationSec != null;
        if (hasReps && hasDuration) errors.push(`${eWhere}: não pode ter targetReps e targetDurationSec`);
        if (ex.metric === 'REPS') {
          if (!hasReps && !(timeBoxed && hasDuration)) {
            errors.push(`${eWhere}: metric REPS exige targetReps (ou targetDurationSec em bloco ${[...TIME_BOXED_FORMATS].join('/')})`);
          }
        } else if (ex.metric === 'DURATION') {
          if (!hasDuration) errors.push(`${eWhere}: metric DURATION exige targetDurationSec`);
        }
        if (hasReps && (entry.targetReps as number) < 1) errors.push(`${eWhere}: targetReps < 1`);
        if (hasDuration && (entry.targetDurationSec as number) < 1) errors.push(`${eWhere}: targetDurationSec < 1`);
      });
    });

    if (!missingSlug) {
      const announced = minutesInName(w.name);
      if (announced != null) {
        const estimated = estimateWorkoutDurationMin(w, bySlug);
        if (Math.abs(estimated - announced) > DURATION_TOLERANCE_MIN) {
          errors.push(`${where}: duração estimada ${estimated} min difere de ${announced} min anunciados (tolerância ${DURATION_TOLERANCE_MIN})`);
        }
      }
    }
  }

  return errors;
}

export function validateSeedData(exercises: SeedExercise[] = EXERCISES, workouts: SeedWorkout[] = SYSTEM_WORKOUTS): SeedValidationSummary {
  const errors = collectSeedErrors(exercises, workouts);
  if (errors.length > 0) {
    throw new Error(`Dados de seed inválidos (${errors.length} problema(s)):\n - ${errors.join('\n - ')}`);
  }
  return {
    exercises: exercises.length,
    bodyweightExercises: exercises.filter(isBodyweight).length,
    progressions: buildProgressionPairs(exercises).length,
    workouts: workouts.length,
  };
}
