/**
 * Seed da base de dados: catálogo de exercícios + treinos de sistema.
 *
 *   pnpm --filter @tlc/database seed        (ou `prisma db seed`)
 *
 * Idempotente: pode correr as vezes que for preciso.
 *   - Exercise            -> upsert por slug
 *   - ExerciseTranslation -> upsert por [exerciseId, locale]
 *   - ExerciseProgression -> upsert por [easierId, harderId]; pares que já não
 *                            existem no seed (entre exercícios do seed) são removidos
 *   - Workout (SYSTEM)    -> upsert por nome; blocos apagados e recriados
 */
import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { EXERCISES, exercisesBySlug } from './seed-data/exercises';
import { SYSTEM_WORKOUTS } from './seed-data/workouts';
import { buildProgressionPairs, resolveWorkout } from './seed-data/derive';
import { validateSeedData } from './seed-data/validate';
import { SEED_LOCALES, type SeedExercise, type ResolvedSeedWorkout } from './seed-data/types';

const prisma = new PrismaClient();

function exerciseData(ex: SeedExercise): Prisma.ExerciseUncheckedCreateInput {
  return {
    slug: ex.slug,
    name: ex.name,
    category: ex.category,
    movementPattern: ex.movementPattern,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    metric: ex.metric,
    isUnilateral: ex.isUnilateral,
    metValue: ex.metValue,
    defaultTempo: ex.defaultTempo,
    isActive: true,
  };
}

async function seedExercises(): Promise<Map<string, string>> {
  const idBySlug = new Map<string, string>();
  let translations = 0;

  for (const ex of EXERCISES) {
    const { slug, ...rest } = exerciseData(ex);
    const row = await prisma.exercise.upsert({
      where: { slug },
      create: { slug, ...rest },
      update: rest,
      select: { id: true },
    });
    idBySlug.set(ex.slug, row.id);

    for (const locale of SEED_LOCALES) {
      const t = ex.translations[locale];
      await prisma.exerciseTranslation.upsert({
        where: { exerciseId_locale: { exerciseId: row.id, locale } },
        create: { exerciseId: row.id, locale, name: t.name, description: t.description, cues: t.cues },
        update: { name: t.name, description: t.description, cues: t.cues },
      });
      translations += 1;
    }
  }

  console.log(`Exercícios: ${idBySlug.size} upserted, ${translations} traduções`);
  return idBySlug;
}

async function seedProgressions(idBySlug: Map<string, string>): Promise<void> {
  const pairs = buildProgressionPairs(EXERCISES);
  const wanted = new Set<string>();

  for (const pair of pairs) {
    const easierId = idBySlug.get(pair.easier);
    const harderId = idBySlug.get(pair.harder);
    if (!easierId || !harderId) throw new Error(`Progressão com slug desconhecido: ${pair.easier} -> ${pair.harder}`);
    wanted.add(`${easierId}=>${harderId}`);
    await prisma.exerciseProgression.upsert({
      where: { easierId_harderId: { easierId, harderId } },
      create: { easierId, harderId },
      update: {},
    });
  }

  // Remove progressões obsoletas entre exercícios do seed.
  const seededIds = [...idBySlug.values()];
  const existing = await prisma.exerciseProgression.findMany({
    where: { easierId: { in: seededIds }, harderId: { in: seededIds } },
    select: { id: true, easierId: true, harderId: true },
  });
  const stale = existing.filter((p) => !wanted.has(`${p.easierId}=>${p.harderId}`)).map((p) => p.id);
  if (stale.length > 0) {
    await prisma.exerciseProgression.deleteMany({ where: { id: { in: stale } } });
  }

  console.log(`Progressões: ${pairs.length} upserted, ${stale.length} removidas`);
}

function blocksCreateInput(workout: ResolvedSeedWorkout, idBySlug: Map<string, string>): Prisma.WorkoutBlockCreateWithoutWorkoutInput[] {
  return workout.blocks.map((block, blockIndex) => ({
    order: blockIndex + 1,
    type: block.type,
    format: block.format,
    name: block.name ?? null,
    rounds: block.rounds,
    timeCapSec: block.timeCapSec,
    restBetweenExercisesSec: block.restBetweenExercisesSec,
    restBetweenRoundsSec: block.restBetweenRoundsSec,
    notes: block.notes ?? null,
    exercises: {
      create: block.exercises.map((entry, exerciseIndex) => {
        const exerciseId = idBySlug.get(entry.slug);
        if (!exerciseId) throw new Error(`Treino "${workout.name}": slug desconhecido "${entry.slug}"`);
        return {
          order: exerciseIndex + 1,
          exercise: { connect: { id: exerciseId } },
          targetReps: entry.targetReps ?? null,
          targetDurationSec: entry.targetDurationSec ?? null,
          restAfterSec: entry.restAfterSec ?? null,
          notes: entry.notes ?? null,
        };
      }),
    },
  }));
}

async function seedWorkouts(idBySlug: Map<string, string>): Promise<void> {
  const bySlug = exercisesBySlug(EXERCISES);
  let created = 0;
  let updated = 0;

  for (const seed of SYSTEM_WORKOUTS) {
    const workout = resolveWorkout(seed, bySlug);
    const data = {
      description: workout.description,
      focus: workout.focus,
      difficulty: workout.difficulty,
      estimatedDurationMin: workout.estimatedDurationMin,
      requiredEquipment: workout.requiredEquipment,
      isPublished: true,
      isArchived: false,
    };
    const blocks = blocksCreateInput(workout, idBySlug);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.workout.findFirst({
        where: { name: workout.name, source: 'SYSTEM' },
        select: { id: true },
      });
      if (existing) {
        await tx.workoutBlock.deleteMany({ where: { workoutId: existing.id } });
        await tx.workout.update({
          where: { id: existing.id },
          data: { ...data, blocks: { create: blocks } },
        });
        updated += 1;
      } else {
        await tx.workout.create({
          data: { name: workout.name, source: 'SYSTEM', ...data, blocks: { create: blocks } },
        });
        created += 1;
      }
    });
  }

  console.log(`Treinos de sistema: ${created} criados, ${updated} atualizados`);
}

async function main(): Promise<void> {
  const summary = validateSeedData();
  console.log(
    `Seed validado: ${summary.exercises} exercícios (${summary.bodyweightExercises} peso corporal), ` +
      `${summary.progressions} progressões, ${summary.workouts} treinos`,
  );

  const idBySlug = await seedExercises();
  await seedProgressions(idBySlug);
  await seedWorkouts(idBySlug);

  const [exerciseCount, translationCount, progressionCount, workoutCount] = await Promise.all([
    prisma.exercise.count(),
    prisma.exerciseTranslation.count(),
    prisma.exerciseProgression.count(),
    prisma.workout.count({ where: { source: 'SYSTEM' } }),
  ]);
  console.log(
    `Totais na BD: ${exerciseCount} exercícios, ${translationCount} traduções, ` +
      `${progressionCount} progressões, ${workoutCount} treinos de sistema`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed falhou:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
