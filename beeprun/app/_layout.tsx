import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { isOnboardingDone } from '../src/storage';
import { supabase } from '../src/supabase';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Handle deep-link auth (magic link tap)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        isOnboardingDone().then(done => {
          if (done) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding/permission');
          }
        });
      }
    });

    isOnboardingDone().then(done => {
      if (!done) router.replace('/onboarding');
      setChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="profile/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
