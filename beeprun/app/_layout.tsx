import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { isOnboardingDone } from '../src/storage';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    isOnboardingDone().then(done => {
      if (!done) router.replace('/onboarding');
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
