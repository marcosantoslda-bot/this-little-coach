import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  FITNESS_GOAL_LABELS,
  FITNESS_GOALS,
  FITNESS_LEVEL_LABELS,
  FITNESS_LEVELS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  SEXES,
  TRAINING_FOCUS_LABELS,
  TRAINING_FOCUSES,
  TRAINING_LOCATIONS,
  TRAINING_MODE_LABELS,
  TRAINING_MODES,
  updateProfileSchema,
  updateUserSchema,
  type Equipment,
  type Me,
  type MuscleGroup,
  type Profile,
  type UpdateProfileInput,
} from '@tlc/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChipGroup, Field, SectionTitle, Segmented, Stepper, Text } from '@/components/ui';
import { normalizeEquipment } from '@/features/onboarding/equipment';
import { formatKg, parseDecimal } from '@/lib/format';
import { SEX_LABELS, TRAINING_LOCATION_LABELS } from '@/lib/labels';
import { spacing } from '@/theme';

type NumericKey = 'heightCm' | 'startingWeightKg' | 'targetWeightKg' | 'bodyFatPct';

export interface ProfileFormState {
  displayName: string;
  profile: Omit<Profile, 'onboardingCompletedAt'>;
  /** Texto dos campos numéricos (para permitir vírgula enquanto se escreve). */
  numeric: Record<NumericKey, string>;
}

export function initialFormState(me: Me): ProfileFormState {
  const { onboardingCompletedAt: _omit, ...profile } = me.profile;
  const num = (v: number | null, digits: number) => (v == null ? '' : digits === 0 ? String(v) : formatKg(v, digits));
  return {
    displayName: me.user.displayName,
    profile,
    numeric: {
      heightCm: num(profile.heightCm, 0),
      startingWeightKg: num(profile.startingWeightKg, 1),
      targetWeightKg: num(profile.targetWeightKg, 1),
      bodyFatPct: num(profile.bodyFatPct, 1),
    },
  };
}

export interface ProfilePatch {
  user: { displayName?: string };
  profile: UpdateProfileInput;
}

/** Calcula só o que mudou; devolve mensagem de erro se algo for inválido. */
export function buildPatch(me: Me, form: ProfileFormState): { patch: ProfilePatch } | { error: string } {
  const user: { displayName?: string } = {};
  if (form.displayName.trim() !== me.user.displayName) user.displayName = form.displayName.trim();
  const userParsed = updateUserSchema.safeParse(user);
  if (!userParsed.success) return { error: 'O nome tem de ter entre 1 e 60 caracteres.' };

  const numeric: Partial<Record<NumericKey, number | null>> = {};
  for (const key of ['heightCm', 'startingWeightKg', 'targetWeightKg', 'bodyFatPct'] as const) {
    const text = form.numeric[key].trim();
    if (text === '') {
      numeric[key] = null;
      continue;
    }
    const n = parseDecimal(text);
    if (n == null) return { error: 'Verifica os campos numéricos.' };
    numeric[key] = key === 'heightCm' ? Math.round(n) : n;
  }

  const candidate: Omit<Profile, 'onboardingCompletedAt'> = { ...form.profile, ...numeric } as Omit<Profile, 'onboardingCompletedAt'>;
  const birth = candidate.birthDate?.trim() ?? '';
  candidate.birthDate = birth === '' ? null : birth;
  candidate.limitationsNote = candidate.limitationsNote?.trim() ? candidate.limitationsNote.trim() : null;

  const profile: UpdateProfileInput = {};
  for (const key of Object.keys(candidate) as (keyof typeof candidate)[]) {
    const before = me.profile[key];
    const after = candidate[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) (profile as Record<string, unknown>)[key] = after;
  }
  const parsed = updateProfileSchema.safeParse(profile);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue ? `${String(issue.path[0] ?? 'Perfil')}: ${issue.message}` : 'Dados inválidos.' };
  }
  return { patch: { user: userParsed.data, profile: parsed.data } };
}

export function ProfileForm({ value, onChange }: { value: ProfileFormState; onChange: (v: ProfileFormState) => void }) {
  const p = value.profile;
  const setProfile = (patch: Partial<typeof p>) => onChange({ ...value, profile: { ...p, ...patch } });
  const setNumeric = (key: NumericKey, text: string) => onChange({ ...value, numeric: { ...value.numeric, [key]: text } });
  const [advanced, setAdvanced] = useState(false);

  return (
    <View>
      <SectionTitle top={spacing.sm}>Conta</SectionTitle>
      <Field label="Nome" value={value.displayName} onChangeText={(displayName) => onChange({ ...value, displayName })} maxLength={60} />

      <SectionTitle>Modo</SectionTitle>
      <Segmented
        dense
        options={TRAINING_MODES.map((m) => ({ value: m, label: TRAINING_MODE_LABELS[m] }))}
        value={p.activeMode}
        onChange={(activeMode) => setProfile({ activeMode })}
      />
      <Text variant="caption" style={styles.caption}>
        Férias, pausa ou doença não partem a sequência; o plano adapta-se.
      </Text>

      <SectionTitle>Objetivo</SectionTitle>
      <ChipGroup options={FITNESS_GOALS.map((g) => ({ value: g, label: FITNESS_GOAL_LABELS[g] }))} value={p.goal} onChange={(goal) => setProfile({ goal })} />

      <SectionTitle>Nível</SectionTitle>
      <ChipGroup options={FITNESS_LEVELS.map((l) => ({ value: l, label: FITNESS_LEVEL_LABELS[l] }))} value={p.fitnessLevel} onChange={(fitnessLevel) => setProfile({ fitnessLevel })} />

      <SectionTitle>Ênfase</SectionTitle>
      <ChipGroup options={TRAINING_FOCUSES.map((f) => ({ value: f, label: TRAINING_FOCUS_LABELS[f] }))} value={p.focus} onChange={(focus) => setProfile({ focus })} />

      <SectionTitle>Dias por semana</SectionTitle>
      <Stepper value={p.trainingDaysPerWeek} min={1} max={7} onChange={(trainingDaysPerWeek) => setProfile({ trainingDaysPerWeek })} format={(v) => (v === 1 ? '1 dia' : `${v} dias`)} />

      <SectionTitle>Minutos por treino</SectionTitle>
      <Stepper value={p.preferredSessionMinutes} min={10} max={120} step={5} onChange={(preferredSessionMinutes) => setProfile({ preferredSessionMinutes })} format={(v) => `${v} min`} />

      <SectionTitle>Onde treinas</SectionTitle>
      <ChipGroup options={TRAINING_LOCATIONS.map((l) => ({ value: l, label: TRAINING_LOCATION_LABELS[l] }))} value={p.preferredLocation} onChange={(preferredLocation) => setProfile({ preferredLocation })} />

      <SectionTitle>Equipamento</SectionTitle>
      <ChipGroup<Equipment>
        multi
        options={EQUIPMENT.map((e) => ({ value: e, label: EQUIPMENT_LABELS[e] }))}
        value={p.availableEquipment}
        onChange={(next) => setProfile({ availableEquipment: normalizeEquipment(p.availableEquipment, next) })}
      />

      <SectionTitle>Corpo</SectionTitle>
      <View style={styles.fields}>
        <ChipGroup options={SEXES.map((s) => ({ value: s, label: SEX_LABELS[s] }))} value={p.sex} onChange={(sex) => setProfile({ sex })} />
        <Field label="Data de nascimento" value={p.birthDate ?? ''} onChangeText={(birthDate) => setProfile({ birthDate })} placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <Field label="Altura" value={value.numeric.heightCm} onChangeText={(v) => setNumeric('heightCm', v)} keyboardType="number-pad" suffix="cm" />
        <Field label="Peso atual" value={value.numeric.startingWeightKg} onChangeText={(v) => setNumeric('startingWeightKg', v)} keyboardType="decimal-pad" suffix="kg" />
        <Field label="Peso alvo" value={value.numeric.targetWeightKg} onChangeText={(v) => setNumeric('targetWeightKg', v)} keyboardType="decimal-pad" suffix="kg" />
        <Field label="Gordura corporal" value={value.numeric.bodyFatPct} onChangeText={(v) => setNumeric('bodyFatPct', v)} keyboardType="decimal-pad" suffix="%" />
      </View>

      <SectionTitle>Limitações</SectionTitle>
      {advanced ? (
        <View style={styles.fields}>
          <Text variant="caption">Músculos a evitar</Text>
          <ChipGroup<MuscleGroup>
            multi
            options={MUSCLE_GROUPS.map((m) => ({ value: m, label: MUSCLE_GROUP_LABELS[m] }))}
            value={p.restrictedMuscles}
            onChange={(restrictedMuscles) => setProfile({ restrictedMuscles })}
          />
          <Field label="Nota" value={p.limitationsNote ?? ''} onChangeText={(limitationsNote) => setProfile({ limitationsNote })} multiline maxLength={500} placeholder="Ex.: joelho direito sensível" />
        </View>
      ) : (
        <Text variant="secondary" onPress={() => setAdvanced(true)} style={styles.link}>
          {p.restrictedMuscles.length > 0 || p.limitationsNote
            ? `${p.restrictedMuscles.map((m) => MUSCLE_GROUP_LABELS[m]).join(', ')}${p.limitationsNote ? ` · ${p.limitationsNote}` : ''} — editar`
            : 'Sem limitações — editar'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { marginTop: spacing.xs },
  fields: { gap: spacing.md },
  link: { textDecorationLine: 'underline' },
});
