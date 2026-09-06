import { EQUIPMENT, EQUIPMENT_LABELS, type Equipment } from '@tlc/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ChipGroup, SectionTitle, Segmented, Stepper, Text } from '@/components/ui';
import { normalizeEquipment } from '@/features/onboarding/equipment';
import { ENERGY_LABELS } from '@/lib/labels';
import { spacing } from '@/theme';

const PRESETS = [15, 25, 40, 60] as const;
type Preset = (typeof PRESETS)[number] | 'custom';

export interface CheckInValue {
  availableMinutes: number;
  energyLevel: number;
  equipment: Equipment[];
}

export interface CheckInProps {
  value: CheckInValue;
  onChange: (value: CheckInValue) => void;
}

function presetFor(minutes: number): Preset {
  return (PRESETS as readonly number[]).includes(minutes) ? (minutes as Preset) : 'custom';
}

/** O check-in de hoje: tempo, energia e equipamento à mão. */
export function CheckIn({ value, onChange }: CheckInProps) {
  const [preset, setPreset] = useState<Preset>(() => presetFor(value.availableMinutes));
  const [editingEquipment, setEditingEquipment] = useState(false);

  const minuteOptions = [
    ...PRESETS.map((m) => ({ value: m as Preset, label: `${m} min` })),
    { value: 'custom' as Preset, label: 'Outro' },
  ];

  return (
    <View>
      <SectionTitle top={spacing.md}>Quanto tempo tens?</SectionTitle>
      <ChipGroup
        options={minuteOptions}
        value={preset}
        onChange={(p) => {
          setPreset(p);
          if (p !== 'custom') onChange({ ...value, availableMinutes: p });
        }}
      />
      {preset === 'custom' ? (
        <View style={styles.stepper}>
          <Stepper
            value={value.availableMinutes}
            min={10}
            max={90}
            step={5}
            onChange={(m) => onChange({ ...value, availableMinutes: m })}
            format={(m) => `${m} min`}
          />
        </View>
      ) : null}

      <SectionTitle>Como te sentes?</SectionTitle>
      <Segmented
        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
        value={value.energyLevel}
        onChange={(n) => onChange({ ...value, energyLevel: n })}
      />
      <Text variant="caption" style={styles.caption}>
        {ENERGY_LABELS[value.energyLevel] ?? ''}
      </Text>

      <View style={styles.equipmentHeader}>
        <SectionTitle>Equipamento à mão</SectionTitle>
        <Button
          title={editingEquipment ? 'Pronto' : 'Editar'}
          variant="ghost"
          compact
          onPress={() => setEditingEquipment((e) => !e)}
        />
      </View>
      {editingEquipment ? (
        <ChipGroup<Equipment>
          multi
          options={EQUIPMENT.map((e) => ({ value: e, label: EQUIPMENT_LABELS[e] }))}
          value={value.equipment}
          onChange={(next) => onChange({ ...value, equipment: normalizeEquipment(value.equipment, next) })}
        />
      ) : (
        <Text variant="secondary">{value.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { marginTop: spacing.md },
  caption: { marginTop: spacing.xs },
  equipmentHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
