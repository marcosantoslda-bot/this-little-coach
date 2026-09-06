import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useAuthSession } from '@/hooks/use-auth-session';
import { errorMessage } from '@/lib/api';
import { useAuthDeepLinks } from '@/lib/auth-links';
import { useMe } from '@/lib/queries/me';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { spacing, useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Porta de entrada: sem sessão → (auth); com sessão mas sem onboarding → (onboarding);
 * caso contrário → (tabs). `Stack.Protected` redireciona sozinho quando o estado muda.
 */
function RootNavigator() {
  const t = useTheme();
  useAuthDeepLinks();
  const { session } = useAuthSession();
  const signedIn = !!session;
  const me = useMe(signedIn);
  const onboarded = !!me.data?.profile.onboardingCompletedAt;

  const navTheme = {
    ...(t.scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: t.text,
      background: t.bg,
      card: t.bg,
      text: t.text,
      border: t.border,
      notification: t.text,
    },
  };

  if (session === undefined || (signedIn && me.isPending)) {
    return <Splash />;
  }

  if (signedIn && me.isError) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <Text variant="title" align="center">
          Não foi possível carregar o teu perfil
        </Text>
        <Text variant="secondary" align="center">
          {errorMessage(me.error)}
        </Text>
        <Button title="Tentar de novo" variant="secondary" onPress={() => void me.refetch()} />
        <Button title="Terminar sessão" variant="ghost" onPress={() => void supabase.auth.signOut()} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="session/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Screen name="auth-callback" />
      </Stack>
    </ThemeProvider>
  );
}

function Splash() {
  const t = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: t.bg }]}>
      <Text variant="label">This Little Coach</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
});
