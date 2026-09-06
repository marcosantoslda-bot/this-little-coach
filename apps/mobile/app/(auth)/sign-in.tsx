import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Field, Screen, Text } from '@/components/ui';
import { authErrorMessage, isValidEmail } from '@/features/auth/auth-errors';
import { authRedirectUrl } from '@/lib/auth-links';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { spacing } from '@/theme';

type Mode = 'password' | 'magic';

export default function SignInScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = isValidEmail(email);

  async function signInWithPassword() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError(authErrorMessage(err));
  }

  async function sendMagicLink() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: true },
    });
    setLoading(false);
    if (err) setError(authErrorMessage(err));
    else setSent(true);
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setLoading(false);
    if (err) setError(authErrorMessage(err));
  }

  const primary =
    mode === 'password' ? (
      <Button
        title="Entrar"
        onPress={() => void signInWithPassword()}
        loading={loading}
        disabled={!emailOk || password.length === 0}
      />
    ) : sent ? (
      <Button title="Confirmar código" onPress={() => void verifyCode()} loading={loading} disabled={code.trim().length < 6} />
    ) : (
      <Button title="Enviar link" onPress={() => void sendMagicLink()} loading={loading} disabled={!emailOk} />
    );

  return (
    <Screen
      title="Entrar"
      footer={
        <View style={styles.footer}>
          {primary}
          {mode === 'password' ? (
            <Button title="Entrar com link por email" variant="ghost" onPress={() => setMode('magic')} />
          ) : (
            <Button
              title="Entrar com palavra-passe"
              variant="ghost"
              onPress={() => {
                setMode('password');
                setSent(false);
              }}
            />
          )}
        </View>
      }
    >
      {!isSupabaseConfigured ? (
        <Text variant="secondary" style={styles.block}>
          Falta configurar EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ficheiro .env.
        </Text>
      ) : null}

      <View style={styles.form}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!sent}
        />
        {mode === 'password' ? (
          <Field
            label="Palavra-passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={() => void signInWithPassword()}
          />
        ) : sent ? (
          <>
            <Text variant="secondary">
              Enviámos um link para {email.trim()}. Abre-o neste telemóvel ou introduz aqui o código do email.
            </Text>
            <Field
              label="Código"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
            <Button title="Reenviar link" variant="ghost" compact onPress={() => void sendMagicLink()} disabled={loading} />
          </>
        ) : (
          <Text variant="secondary">Recebes um link por email. Sem palavra-passe.</Text>
        )}
        {error ? <Text>{error}</Text> : null}
      </View>

      <View style={styles.block}>
        <Text variant="secondary">Ainda não tens conta?</Text>
        <Button title="Criar conta" variant="ghost" compact onPress={() => router.push('/(auth)/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginTop: spacing.sm },
  block: { marginTop: spacing.lg, gap: spacing.xs },
  footer: { gap: spacing.xs },
});
