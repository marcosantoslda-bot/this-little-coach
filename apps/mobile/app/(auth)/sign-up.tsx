import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Field, Screen, Text } from '@/components/ui';
import { authErrorMessage, isValidEmail } from '@/features/auth/auth-errors';
import { authRedirectUrl } from '@/lib/auth-links';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const canSubmit = isValidEmail(email) && password.length >= 8;

  async function signUp() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authRedirectUrl(),
        data: name.trim() ? { display_name: name.trim() } : undefined,
      },
    });
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err));
      return;
    }
    // Sem sessão = o projeto Supabase exige confirmação de email.
    if (!data.session) setNeedsConfirmation(true);
  }

  if (needsConfirmation) {
    return (
      <Screen
        title="Confirma o email"
        footer={<Button title="Voltar a entrar" onPress={() => router.replace('/(auth)/sign-in')} />}
      >
        <Text>
          Enviámos um email para {email.trim()}. Abre o link nesse email para ativar a conta e depois entra.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      title="Criar conta"
      back
      footer={
        <View style={styles.footer}>
          <Button title="Criar conta" onPress={() => void signUp()} loading={loading} disabled={!canSubmit} />
          <Button title="Já tenho conta" variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      }
    >
      <View style={styles.form}>
        <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Palavra-passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="Pelo menos 8 caracteres"
          onSubmitEditing={() => void signUp()}
        />
        {error ? <Text>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginTop: spacing.sm },
  footer: { gap: spacing.xs },
});
