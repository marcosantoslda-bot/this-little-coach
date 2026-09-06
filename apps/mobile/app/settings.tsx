import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ConfirmSheet, ErrorState, Loading, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { buildPatch, initialFormState, ProfileForm, type ProfileFormState } from '@/features/settings/ProfileForm';
import { errorMessage } from '@/lib/api';
import { useDeleteAccount, useMe, useUpdateProfile, useUpdateUser } from '@/lib/queries/me';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session-store';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const updateUser = useUpdateUser();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const clearActive = useSessionStore((s) => s.clearActive);

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (me.data && !form) setForm(initialFormState(me.data));
  }, [me.data, form]);

  async function save() {
    if (!me.data || !form) return;
    setError(null);
    setSaved(false);
    const result = buildPatch(me.data, form);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    try {
      if (result.patch.user.displayName !== undefined) await updateUser.mutateAsync(result.patch.user);
      if (Object.keys(result.patch.profile).length > 0) await updateProfile.mutateAsync(result.patch.profile);
      setSaved(true);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function signOut() {
    setConfirmSignOut(false);
    await supabase.auth.signOut();
    clearActive();
    qc.clear();
  }

  function removeAccount() {
    deleteAccount.mutate(undefined, {
      onSuccess: () => void signOut(),
      onError: (e) => {
        setConfirmDelete(false);
        setError(`Não foi possível apagar a conta: ${errorMessage(e)}`);
      },
    });
  }

  const saving = updateUser.isPending || updateProfile.isPending;

  return (
    <Screen
      title="Definições"
      back
      footer={<Button title="Guardar" onPress={() => void save()} loading={saving} disabled={!form} />}
    >
      {me.isPending || !form ? (
        <Loading />
      ) : me.isError ? (
        <ErrorState error={me.error} onRetry={() => void me.refetch()} />
      ) : (
        <>
          <Text variant="secondary">{me.data.user.email}</Text>
          <ProfileForm value={form} onChange={setForm} />
          {error ? <Text style={styles.message}>{error}</Text> : saved ? <Text variant="caption" style={styles.message}>Guardado.</Text> : null}

          <SectionTitle>Sessão</SectionTitle>
          <Row title="Terminar sessão" onPress={() => setConfirmSignOut(true)} chevron={false} />
          <Row title="Apagar conta" subtitle="Remove o perfil e o histórico. Não é reversível." onPress={() => setConfirmDelete(true)} chevron={false} last />
          <View style={styles.bottom} />
        </>
      )}

      <ConfirmSheet
        visible={confirmSignOut}
        title="Terminar sessão?"
        confirmLabel="Terminar sessão"
        onConfirm={() => void signOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar conta?"
        message="Todos os dados são apagados de forma permanente."
        confirmLabel="Apagar a minha conta"
        onConfirm={removeAccount}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteAccount.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: spacing.md },
  bottom: { height: spacing.lg },
});
