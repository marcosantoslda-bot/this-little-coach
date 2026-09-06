import type { Profile as ProfileRow, User as UserRow } from '@tlc/database';
import type { Me, Profile, User } from '@tlc/shared';
import { toIso, toIsoDate, toNumber } from '../../common/mapping/primitives';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    locale: row.locale as User['locale'],
    timezone: row.timezone,
    role: row.role,
    createdAt: toIso(row.createdAt),
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    sex: row.sex,
    birthDate: toIsoDate(row.birthDate),
    heightCm: row.heightCm,
    startingWeightKg: toNumber(row.startingWeightKg),
    targetWeightKg: toNumber(row.targetWeightKg),
    bodyFatPct: toNumber(row.bodyFatPct),
    goal: row.goal,
    fitnessLevel: row.fitnessLevel,
    focus: row.focus,
    trainingDaysPerWeek: row.trainingDaysPerWeek,
    preferredSessionMinutes: row.preferredSessionMinutes,
    preferredLocation: row.preferredLocation,
    availableEquipment: row.availableEquipment,
    activeMode: row.activeMode,
    restrictedMuscles: row.restrictedMuscles,
    limitationsNote: row.limitationsNote,
    onboardingCompletedAt: toIso(row.onboardingCompletedAt),
  };
}

export function toMe(user: UserRow, profile: ProfileRow): Me {
  return { user: toUser(user), profile: toProfile(profile) };
}

export function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return { id: row.id, authId: row.authId, email: row.email, locale: row.locale, timezone: row.timezone, role: row.role };
}
