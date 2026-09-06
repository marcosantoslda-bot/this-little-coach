import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, ConfirmSheet, Row, Screen, SectionTitle, SettingsButton, Text } from '@/components/ui';
import { CheckIn, type CheckInValue } from '@/features/today/CheckIn';
import { errorMessage } from '@/lib/api';
import { formatDateLong, formatDateShort, secondsToMinutes } from '@/lib/format';
import { useMe } from '@/lib/queries/me';
import { useProgressOverview } from '@/lib/queries/progress';
import { useAbandonSession, useSessions } from '@/lib/queries/sessions';
import { useGenerateWorkout } from '@/lib/queries/workouts';
import { useSessionStore } from '@/stores/session-store';
import { spacing } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const me = useMe();
  const overview = useProgressOverview();
  const lastSessions = useSessions({ status: 'COMPLETED', limit: 1 });
  const generate = useGenerateWorkout();
  const abandon = useAbandonSession();
  const active = useSessionStore((s) => s.active);
  const clearActive = useSessionStore((s) => s.clearActive);
  const discardQueue = useSessionStore((s) => s.discardQueue);

  const profile = me.data?.profile;
  const [checkIn, setCheckIn] = useState<CheckInValue>({
    availableMinutes: profile?.preferredSessionMinutes ?? 25,
    energyLevel: 3,
    equipment: profile?.availableEquipment.length ? profile.availableEquipment : ['NONE'],
  });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quando o perfil chega (ou muda nas definições), realinha o check-in.
  // Depende dos valores, não do objeto, para não apagar escolhas a cada refetch.
  const profileMinutes = profile?.preferredSessionMinutes;
  const profileEquipment = profile?.availableEquipment.join(',');
  useEffect(() => {
    if (profileMinutes == null || profileEquipment == null) return;
    const equipment = profileEquipment.split(',').filter(Boolean) as CheckInValue['equipment'];
    setCheckIn((c) => ({
      ...c,
      availableMinutes: Math.min(90, Math.max(10, profileMinutes)),
      equipment: equipment.length ? equipment : ['NONE'],
    }));
  }, [profileMinutes, profileEquipment]);

  function generateWorkout() {
    setError(null);
    generate.mutate(
      { availableMinutes: checkIn.availableMinutes, energyLevel: checkIn.energyLevel, equipment: checkIn.equipment },
      {
        onSuccess: (w) => router.push({ pathname: '/workout/[id]', params: { id: w.id, energy: String(checkIn.energyLevel) } }),
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  function discardActive() {
    if (!active) return;
    const id = active.id;
    abandon.mutate(id, {
      onSettled: () => {
        discardQueue(id);
        clearActive();
        setConfirmDiscard(false);
      },
    });
  }

  const week = overview.data?.week;
  const last = lastSessions.data?.pages[0]?.items[0];
  const firstName = me.data?.user.displayName.split(' ')[0];

  return (
    <Screen
      title="Hoje"
      subtitle={formatDateLong()}
      right={<SettingsButton />}
      footer={
        active ? (
          <Button title="Continuar treino" onPress={() => router.push({ pathname: '/session/[id]', params: { id: active.id } })} />
        ) : (
          <Button title="Gerar treino" onPress={generateWorkout} loading={generate.isPending} />
        )
      }
    >
      {active ? (
        <Card style={styles.activeCard}>
          <Text variant="label">Treino em curso</Text>
          <Text variant="title">{active.workoutName}</Text>
          <Text variant="secondary">Começado às {new Date(active.startedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text>
          <Button title="Descartar" variant="ghost" compact onPress={() => setConfirmDiscard(true)} />
        </Card>
      ) : (
        <>
          {firstName ? <Text variant="secondary">Olá, {firstName}.</Text> : null}
          <CheckIn value={checkIn} onChange={setCheckIn} />
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}
        </>
      )}

      <SectionTitle>Esta semana</SectionTitle>
      <Row
        title={week ? `${week.sessionsCompleted} de ${week.sessionsTarget} treinos` : 'A carregar…'}
        subtitle={week ? `${week.totalMinutes} min · ${week.totalSets} séries` : undefined}
        onPress={() => router.push('/(tabs)/progress')}
      />
      {last ? (
        <Row
          title={last.workoutName}
          subtitle={`${formatDateShort(last.startedAt)} · ${secondsToMinutes(last.durationSec)} min${last.rpe ? ` · RPE ${last.rpe}` : ''}`}
          onPress={() => router.push({ pathname: '/history/[id]', params: { id: last.id } })}
          last
        />
      ) : lastSessions.isSuccess ? (
        <Row title="Ainda sem treinos concluídos" last />
      ) : null}

      <ConfirmSheet
        visible={confirmDiscard}
        title="Descartar treino em curso?"
        message="As séries registadas nesta sessão não são guardadas."
        confirmLabel="Descartar"
        onConfirm={discardActive}
        onCancel={() => setConfirmDiscard(false)}
        loading={abandon.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeCard: { gap: spacing.xs, marginTop: spacing.sm },
  error: { marginTop: spacing.md },
});
