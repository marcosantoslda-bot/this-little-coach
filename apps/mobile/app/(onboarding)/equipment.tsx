import { EQUIPMENT, EQUIPMENT_LABELS, type Equipment } from '@tlc/shared';
import { useRouter } from 'expo-router';
import { normalizeEquipment } from '@/features/onboarding/equipment';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { OptionList } from '@/features/onboarding/OptionList';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function EquipmentStep() {
  const router = useRouter();
  const equipment = useOnboardingStore((s) => s.availableEquipment);
  const setEquipment = useOnboardingStore((s) => s.setEquipment);
  return (
    <OnboardingStep
      step={3}
      title="Que equipamento tens?"
      subtitle="Escolhe tudo o que se aplica."
      nextDisabled={equipment.length === 0}
      onNext={() => router.push('/(onboarding)/time')}
    >
      <OptionList<Equipment>
        multi
        options={EQUIPMENT.map((e) => ({ value: e, label: EQUIPMENT_LABELS[e] }))}
        value={equipment}
        onChange={(next) => setEquipment(normalizeEquipment(equipment, next))}
      />
    </OnboardingStep>
  );
}
