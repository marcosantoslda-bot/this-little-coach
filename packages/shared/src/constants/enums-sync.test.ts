/**
 * Garante que os enums espelhados em enums.ts batem certo com o schema Prisma.
 * Se alterares um enum no schema, tens de o alterar aqui também.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as enums from './enums';

const SCHEMA_PATH = fileURLToPath(new URL('../../../database/prisma/schema.prisma', import.meta.url));

/** Nome do enum no Prisma → nome da constante em enums.ts. */
const ENUM_TO_CONSTANT: Record<string, keyof typeof enums> = {
  UserRole: 'USER_ROLES',
  Sex: 'SEXES',
  FitnessGoal: 'FITNESS_GOALS',
  FitnessLevel: 'FITNESS_LEVELS',
  TrainingFocus: 'TRAINING_FOCUSES',
  TrainingLocation: 'TRAINING_LOCATIONS',
  TrainingMode: 'TRAINING_MODES',
  Equipment: 'EQUIPMENT',
  MuscleGroup: 'MUSCLE_GROUPS',
  MovementPattern: 'MOVEMENT_PATTERNS',
  ExerciseCategory: 'EXERCISE_CATEGORIES',
  ExerciseMetric: 'EXERCISE_METRICS',
  WorkoutFocus: 'WORKOUT_FOCUSES',
  WorkoutFormat: 'WORKOUT_FORMATS',
  WorkoutSource: 'WORKOUT_SOURCES',
  BlockType: 'BLOCK_TYPES',
  SessionStatus: 'SESSION_STATUSES',
  SessionSource: 'SESSION_SOURCES',
  SetAdjustmentReason: 'SET_ADJUSTMENT_REASONS',
  RecordMetric: 'RECORD_METRICS',
  MeasurementSource: 'MEASUREMENT_SOURCES',
};

/** Extrai `enum Nome { A B C }` do schema, ignorando comentários `//` e `///` e atributos `@@…`. */
function parsePrismaEnums(schema: string): Map<string, string[]> {
  const withoutComments = schema.replace(/\/\/.*$/gm, '');
  const result = new Map<string, string[]>();
  for (const match of withoutComments.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
    const [, name, body] = match;
    const values = (body ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('@@'))
      .map((line) => line.split(/\s+/)[0] as string);
    result.set(name as string, values);
  }
  return result;
}

describe('enums.ts ↔ schema.prisma', () => {
  const prismaEnums = parsePrismaEnums(readFileSync(SCHEMA_PATH, 'utf8'));

  it('o schema tem todos os enums mapeados', () => {
    for (const name of Object.keys(ENUM_TO_CONSTANT)) expect(prismaEnums.has(name), `enum ${name} em falta no schema`).toBe(true);
  });

  it('não há enums no schema por espelhar', () => {
    expect([...prismaEnums.keys()].sort()).toEqual(Object.keys(ENUM_TO_CONSTANT).sort());
  });

  it.each(Object.entries(ENUM_TO_CONSTANT))('%s ↔ %s', (prismaName, constantName) => {
    expect([...(enums[constantName] as readonly string[])]).toEqual(prismaEnums.get(prismaName));
  });
});
