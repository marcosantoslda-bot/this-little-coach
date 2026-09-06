import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES, type Equipment, type WorkoutFocus } from '../../constants/enums';
import { FIXTURE_BY_ID, FIXTURE_CATALOG } from './__fixtures__/catalog';
import { summarizeWorkoutDuration } from './duration';
import { mapTrainingFocusToWorkoutFocus } from './focus';
import { EMPTY_CATALOG_MESSAGE, GENERATOR_VERSION, generateWorkout } from './generate-workout';
import type { EngineProfile, GenerateWorkoutParams, GeneratedWorkout } from './types';

const BASE_PROFILE: EngineProfile = {
  fitnessLevel: 'INTERMEDIATE',
  goal: 'LOSE_FAT',
  focus: 'BALANCED',
  restrictedMuscles: [],
  activeMode: 'NORMAL',
  bodyWeightKg: 70,
};

const ALL_EQUIPMENT: Equipment[] = ['NONE', 'MAT', 'PULL_UP_BAR', 'RESISTANCE_BAND', 'DUMBBELLS', 'KETTLEBELL', 'JUMP_ROPE'];

function params(overrides: Partial<GenerateWorkoutParams> = {}, profile: Partial<EngineProfile> = {}): GenerateWorkoutParams {
  return {
    profile: { ...BASE_PROFILE, ...profile },
    availableMinutes: 25,
    energyLevel: 3,
    equipment: ['NONE', 'MAT'],
    seed: 42,
    ...overrides,
  };
}

const mainBlock = (workout: GeneratedWorkout) => workout.blocks.find((b) => b.type === 'MAIN')!;
const allExerciseIds = (workout: GeneratedWorkout) => workout.blocks.flatMap((b) => b.exercises.map((e) => e.exerciseId));
const mainIds = (workout: GeneratedWorkout) => mainBlock(workout).exercises.map((e) => e.exerciseId);
const meanMainDifficulty = (workout: GeneratedWorkout) => {
  const ids = mainIds(workout);
  return ids.reduce((sum, id) => sum + FIXTURE_BY_ID.get(id)!.difficulty, 0) / ids.length;
};
/** Segundos de trabalho do bloco principal (sem descansos), somando todas as voltas. */
const mainWorkSec = (workout: GeneratedWorkout) => {
  const block = mainBlock(workout);
  const perRound = block.exercises.reduce((sum, e) => {
    const sides = FIXTURE_BY_ID.get(e.exerciseId)!.isUnilateral ? 2 : 1;
    return sum + ((e.targetDurationSec ?? (e.targetReps ?? 0) * 3) * sides);
  }, 0);
  return perRound * block.rounds;
};
const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const SEEDS = [1, 2, 3, 4, 5, 6];

describe('generateWorkout', () => {
  it('é determinístico para a mesma seed e inputs', () => {
    const a = generateWorkout(params({ seed: 123 }), FIXTURE_CATALOG);
    const b = generateWorkout(params({ seed: 123 }), FIXTURE_CATALOG);
    expect(a).toEqual(b);
    expect(a.generatorVersion).toBe(GENERATOR_VERSION);
    expect(a.generationInput).toEqual(params({ seed: 123 }));
  });

  it('seeds diferentes produzem treinos diferentes', () => {
    const workouts = SEEDS.map((seed) => generateWorkout(params({ seed }), FIXTURE_CATALOG));
    const signatures = new Set(workouts.map((w) => mainIds(w).join(',')));
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('respeita o equipamento disponível', () => {
    const bodyweightOnly = generateWorkout(params({ equipment: ['NONE'] }), FIXTURE_CATALOG);
    for (const id of allExerciseIds(bodyweightOnly)) {
      expect(FIXTURE_BY_ID.get(id)!.equipment).toEqual(['NONE']);
    }
    expect(bodyweightOnly.requiredEquipment).toEqual(['NONE']);

    const withBar = generateWorkout(params({ equipment: ['NONE', 'PULL_UP_BAR'], focus: 'UPPER_BODY' }), FIXTURE_CATALOG);
    for (const item of withBar.requiredEquipment) expect(['NONE', 'PULL_UP_BAR']).toContain(item);
    expect(mainIds(withBar).some((id) => ['inverted-row', 'pull-up'].includes(id))).toBe(true);
    expect(withBar.requiredEquipment).toEqual(['PULL_UP_BAR']);
  });

  it('exclui exercícios cujos músculos primários estão restritos', () => {
    for (const seed of SEEDS) {
      const workout = generateWorkout(params({ seed, equipment: ALL_EQUIPMENT }, { restrictedMuscles: ['SHOULDERS', 'LOWER_BACK'] }), FIXTURE_CATALOG);
      for (const id of allExerciseIds(workout)) {
        const primary = FIXTURE_BY_ID.get(id)!.primaryMuscles;
        expect(primary).not.toContain('SHOULDERS');
        expect(primary).not.toContain('LOWER_BACK');
      }
    }
  });

  it.each([15, 25, 45])('a duração estimada fica dentro de ±10%% para %i min', (minutes) => {
    for (const seed of SEEDS) {
      for (const goal of ['LOSE_FAT', 'GAIN_MUSCLE', 'GENERAL_HEALTH'] as const) {
        const workout = generateWorkout(params({ seed, availableMinutes: minutes }, { goal }), FIXTURE_CATALOG);
        expect(Math.abs(workout.estimatedDurationMin - minutes)).toBeLessThanOrEqual(minutes * 0.1);
        expect(summarizeWorkoutDuration(workout.blocks, FIXTURE_CATALOG)).toBe(workout.estimatedDurationMin);
      }
    }
  });

  it('energia baixa baixa a dificuldade e o volume', () => {
    const low = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 1 }), FIXTURE_CATALOG));
    const high = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 5 }), FIXTURE_CATALOG));
    const normal = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 3 }), FIXTURE_CATALOG));
    expect(average(low.map(meanMainDifficulty))).toBeLessThan(average(high.map(meanMainDifficulty)));
    expect(average(low.map(mainWorkSec))).toBeLessThan(average(normal.map(mainWorkSec)));
    expect(low[0]!.explanation.join(' ')).toMatch(/energia está baixa/);
  });

  it('modo DOENTE baixa a dificuldade, encurta e retira o finisher', () => {
    const sick = SEEDS.map((seed) => generateWorkout(params({ seed, availableMinutes: 40 }, { activeMode: 'SICK' }), FIXTURE_CATALOG));
    const normal = SEEDS.map((seed) => generateWorkout(params({ seed, availableMinutes: 40 }), FIXTURE_CATALOG));
    expect(average(sick.map(meanMainDifficulty))).toBeLessThan(average(normal.map(meanMainDifficulty)));
    expect(average(sick.map((w) => w.estimatedDurationMin))).toBeLessThan(average(normal.map((w) => w.estimatedDurationMin)));
    for (const workout of sick) {
      expect(workout.blocks.some((b) => b.type === 'FINISHER')).toBe(false);
      expect(mainBlock(workout).rounds).toBeLessThanOrEqual(3);
      expect(mainBlock(workout).exercises.length).toBeLessThanOrEqual(5);
    }
    expect(normal.every((w) => w.blocks.some((b) => b.type === 'FINISHER'))).toBe(true);
  });

  it('nunca repete um exercício no mesmo treino', () => {
    for (const seed of SEEDS) {
      const workout = generateWorkout(params({ seed, availableMinutes: 45, equipment: ALL_EQUIPMENT }), FIXTURE_CATALOG);
      const ids = allExerciseIds(workout);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ordena os blocos AQUECIMENTO → PRINCIPAL → [FINISHER] → RETORNO À CALMA com ordens contíguas', () => {
    const workout = generateWorkout(params({ availableMinutes: 40 }), FIXTURE_CATALOG);
    expect(workout.blocks.map((b) => b.type)).toEqual(['WARMUP', 'MAIN', 'FINISHER', 'COOLDOWN']);
    const rank = (type: string) => BLOCK_TYPES.indexOf(type as (typeof BLOCK_TYPES)[number]);
    workout.blocks.forEach((block, index) => {
      expect(block.order).toBe(index);
      if (index > 0) expect(rank(block.type)).toBeGreaterThan(rank(workout.blocks[index - 1]!.type));
      block.exercises.forEach((exercise, i) => expect(exercise.order).toBe(i));
      expect(block.rounds).toBeGreaterThanOrEqual(1);
    });
    const [warmup, , finisher, cooldown] = workout.blocks;
    expect(warmup!.exercises.every((e) => e.targetDurationSec != null && e.targetDurationSec >= 30 && e.targetDurationSec <= 40)).toBe(true);
    expect(warmup!.exercises.every((e) => ['MOBILITY', 'CARDIO'].includes(FIXTURE_BY_ID.get(e.exerciseId)!.category))).toBe(true);
    expect(cooldown!.exercises.every((e) => e.targetDurationSec === 30)).toBe(true);
    expect(cooldown!.exercises.every((e) => ['STRETCH', 'MOBILITY'].includes(FIXTURE_BY_ID.get(e.exerciseId)!.category))).toBe(true);
    expect(finisher!.timeCapSec).not.toBeNull();
    expect(['AMRAP', 'TABATA']).toContain(finisher!.format);
  });

  it('mapeia o foco do perfil e respeita o foco explícito', () => {
    expect(mapTrainingFocusToWorkoutFocus('BALANCED')).toBe('FULL_BODY');
    expect(mapTrainingFocusToWorkoutFocus('LOWER_BODY_GLUTES')).toBe('LOWER_BODY');
    expect(mapTrainingFocusToWorkoutFocus('UPPER_BODY_ARMS')).toBe('UPPER_BODY');
    expect(mapTrainingFocusToWorkoutFocus('CORE')).toBe('CORE');
    expect(mapTrainingFocusToWorkoutFocus('CARDIO')).toBe('CARDIO');

    const fromProfile = generateWorkout(params({ availableMinutes: 40 }, { focus: 'LOWER_BODY_GLUTES' }), FIXTURE_CATALOG);
    expect(fromProfile.focus).toBe('LOWER_BODY');
    expect(fromProfile.name).toMatch(/^Pernas e glúteos · \d+ min$/);
    const lowerPatterns = mainIds(fromProfile).map((id) => FIXTURE_BY_ID.get(id)!.movementPattern);
    expect(lowerPatterns.filter((p) => p === 'SQUAT' || p === 'LUNGE').length).toBeGreaterThanOrEqual(2);
    expect(lowerPatterns.filter((p) => p === 'HINGE').length).toBeGreaterThanOrEqual(2);

    const explicit: WorkoutFocus = 'CORE';
    const fromParams = generateWorkout(params({ focus: explicit }, { focus: 'LOWER_BODY_GLUTES' }), FIXTURE_CATALOG);
    expect(fromParams.focus).toBe('CORE');
    expect(fromParams.name).toMatch(/^Core · \d+ min$/);
  });

  it('corpo inteiro cobre agachar, dobradiça, empurrar e core', () => {
    const workout = generateWorkout(params({ availableMinutes: 30 }), FIXTURE_CATALOG);
    const patterns = new Set(mainIds(workout).map((id) => FIXTURE_BY_ID.get(id)!.movementPattern));
    expect([...patterns].some((p) => p === 'SQUAT' || p === 'LUNGE')).toBe(true);
    expect(patterns.has('HINGE')).toBe(true);
    expect([...patterns].some((p) => p === 'PUSH_HORIZONTAL' || p === 'PUSH_VERTICAL')).toBe(true);
    expect(workout.name).toMatch(/^Corpo inteiro · \d+ min$/);
  });

  it('escolhe o formato pelo objetivo e pelo tempo', () => {
    expect(mainBlock(generateWorkout(params({ availableMinutes: 15 }, { goal: 'LOSE_FAT' }), FIXTURE_CATALOG)).format).toBe('AMRAP');
    expect(mainBlock(generateWorkout(params({ availableMinutes: 15 }, { goal: 'LOSE_FAT' }), FIXTURE_CATALOG)).timeCapSec).not.toBeNull();
    expect(mainBlock(generateWorkout(params({ availableMinutes: 30 }, { goal: 'IMPROVE_ENDURANCE' }), FIXTURE_CATALOG)).format).toBe('CIRCUIT');
    expect(mainBlock(generateWorkout(params({ availableMinutes: 30 }, { goal: 'GAIN_MUSCLE' }), FIXTURE_CATALOG)).format).toBe('STRAIGHT_SETS');
    expect(mainBlock(generateWorkout(params({ availableMinutes: 30 }, { goal: 'MAINTAIN' }), FIXTURE_CATALOG)).format).toBe('CIRCUIT');
  });

  it('troca por variantes mais fáceis quando o exercício está acima do alvo', () => {
    // Iniciante com energia baixa → alvo [1, 1]: pistol squat (5) e flexões (3) têm de descer para as variantes fáceis.
    const workouts = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 1, availableMinutes: 30 }, { fitnessLevel: 'BEGINNER' }), FIXTURE_CATALOG));
    for (const workout of workouts) {
      for (const id of mainIds(workout)) expect(FIXTURE_BY_ID.get(id)!.difficulty).toBeLessThanOrEqual(2);
      expect(workout.difficulty).toBeLessThanOrEqual(2);
    }
    expect(workouts.some((w) => w.explanation.some((s) => s.startsWith('Troquei ')))).toBe(true);
  });

  it('sobe para variantes mais difíceis só com energia alta em modo normal', () => {
    const athlete = { fitnessLevel: 'ATHLETE' as const };
    const eager = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 5 }, athlete), FIXTURE_CATALOG));
    expect(eager.some((w) => mainIds(w).includes('pistol-squat'))).toBe(true);
    const tired = SEEDS.map((seed) => generateWorkout(params({ seed, energyLevel: 2 }, athlete), FIXTURE_CATALOG));
    expect(tired.every((w) => !w.explanation.some((s) => /mais difícil/.test(s)))).toBe(true);
  });

  it('exercícios unilaterais levam a nota "por lado" e alvos ficam preenchidos', () => {
    const workout = generateWorkout(params({ availableMinutes: 45, equipment: ALL_EQUIPMENT }), FIXTURE_CATALOG);
    for (const block of workout.blocks) {
      for (const exercise of block.exercises) {
        const meta = FIXTURE_BY_ID.get(exercise.exerciseId)!;
        expect(exercise.targetReps != null || exercise.targetDurationSec != null).toBe(true);
        expect(exercise.targetLoadKg).toBeNull();
        expect(exercise.targetDistanceM).toBeNull();
        if (meta.isUnilateral) expect(exercise.notes).toBe('por lado');
      }
    }
  });

  it('lança erro em pt-PT quando o catálogo filtrado fica vazio', () => {
    expect(() => generateWorkout(params(), [])).toThrow(EMPTY_CATALOG_MESSAGE);
    const onlyBar = FIXTURE_CATALOG.filter((e) => e.equipment.includes('PULL_UP_BAR'));
    expect(() => generateWorkout(params({ equipment: ['NONE'] }), onlyBar)).toThrow(/Não há exercícios compatíveis/);
  });

  it('degrada graciosamente com catálogos pequenos', () => {
    const tiny = FIXTURE_CATALOG.slice(0, 3);
    const workout = generateWorkout(params({ availableMinutes: 20 }), tiny);
    expect(mainBlock(workout).exercises.length).toBeGreaterThan(0);
    const ids = allExerciseIds(workout);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gera uma explicação com 3–5 frases em pt-PT', () => {
    for (const seed of SEEDS) {
      const workout = generateWorkout(params({ seed, availableMinutes: 30, equipment: ALL_EQUIPMENT }), FIXTURE_CATALOG);
      expect(workout.explanation.length).toBeGreaterThanOrEqual(3);
      expect(workout.explanation.length).toBeLessThanOrEqual(5);
      expect(workout.explanation.every((s) => s.trim().length > 0)).toBe(true);
      expect(workout.explanation[0]).toMatch(/30 minutos/);
      expect(workout.description).toBeTruthy();
    }
  });
});
