import { describe, expect, it } from 'vitest';
import { MovementPattern } from '@prisma/client';
import { EXERCISES, exercisesBySlug, isBodyweight } from './exercises';
import { SYSTEM_WORKOUTS } from './workouts';
import { buildProgressionPairs, minutesInName, resolveWorkout } from './derive';
import { DURATION_TOLERANCE_MIN, validateSeedData } from './validate';

const bySlug = exercisesBySlug(EXERCISES);
const bodyweight = EXERCISES.filter(isBodyweight);

describe('seed data', () => {
  it('passes validateSeedData()', () => {
    expect(() => validateSeedData()).not.toThrow();
  });

  it('has at least 60 bodyweight exercises', () => {
    expect(bodyweight.length).toBeGreaterThanOrEqual(60);
  });

  it('has at least 8 system workouts', () => {
    expect(SYSTEM_WORKOUTS.length).toBeGreaterThanOrEqual(8);
  });

  it('covers every MovementPattern with bodyweight exercises', () => {
    const covered = new Set(bodyweight.map((e) => e.movementPattern));
    const missing = Object.values(MovementPattern).filter((p) => !covered.has(p));
    expect(missing).toEqual([]);
  });

  it('declares each progression pair exactly once', () => {
    const pairs = buildProgressionPairs(EXERCISES);
    const keys = pairs.map((p) => `${p.easier}=>${p.harder}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(pairs.length).toBeGreaterThan(40);
  });

  it('estimates durations close to the minutes announced in workout names', () => {
    for (const workout of SYSTEM_WORKOUTS) {
      const announced = minutesInName(workout.name);
      const resolved = resolveWorkout(workout, bySlug);
      expect(announced).not.toBeNull();
      expect(Math.abs(resolved.estimatedDurationMin - (announced as number))).toBeLessThanOrEqual(DURATION_TOLERANCE_MIN);
      expect(resolved.requiredEquipment.length).toBeGreaterThan(0);
    }
  });

  it('keeps "Cardio sem saltos" free of JUMP exercises', () => {
    const workout = SYSTEM_WORKOUTS.find((w) => w.name.startsWith('Cardio sem saltos'));
    expect(workout).toBeDefined();
    const patterns = workout!.blocks.flatMap((b) => b.exercises.map((e) => bySlug.get(e.slug)?.movementPattern));
    expect(patterns).not.toContain('JUMP');
  });

  it('keeps the morning mobility workout at difficulty 1 exercises only', () => {
    const workout = SYSTEM_WORKOUTS.find((w) => w.name.startsWith('Mobilidade'));
    expect(workout).toBeDefined();
    const difficulties = workout!.blocks.flatMap((b) => b.exercises.map((e) => bySlug.get(e.slug)?.difficulty));
    expect(difficulties.every((d) => d === 1)).toBe(true);
  });
});
