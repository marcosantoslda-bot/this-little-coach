import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="goal" />
      <Stack.Screen name="level" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="time" />
    </Stack>
  );
}
