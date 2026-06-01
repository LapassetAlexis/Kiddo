import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api-client';
import WakeUpScreen from '@/components/WakeUpScreen';

async function pingUntilAlive(signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal });
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 2500));
  }
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    pingUntilAlive(ctrl.signal).then(() => setAwake(true));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (loading || !awake) return;

    const inAuth   = segments[0] === '(auth)';
    const inParent = segments[0] === '(parent)';
    const inChild  = segments[0] === '(child)';

    const currentScreen = (segments as string[])[1];
    const isSwitchingToChild = inAuth &&
      (currentScreen === 'child-select' || currentScreen === 'child-pin');

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (isSwitchingToChild) {
      // parent switching to child mode — let through
    } else if (user.role === 'parent' && !inParent) {
      router.replace('/(parent)/dashboard');
    } else if (user.role === 'child' && !inChild) {
      router.replace('/(child)/home');
    }
  }, [user, loading, awake, segments[0]]);

  if (!awake || loading) {
    return <WakeUpScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgScreen } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(child)" />
      <Stack.Screen name="(parent)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={Colors.bgScreen} />
      <RootNavigator />
    </AuthProvider>
  );
}
