import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/api-client';

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth   = segments[0] === '(auth)';
    const inParent = segments[0] === '(parent)';
    const inChild  = segments[0] === '(child)';

    const currentScreen = (segments as string[])[1];
    // child-select et child-pin sont accessibles à un parent connecté (switch de mode)
    const isSwitchingToChild = inAuth &&
      (currentScreen === 'child-select' || currentScreen === 'child-pin');

    if (!user) {
      // Pas connecté → login
      if (!inAuth) router.replace('/(auth)/login');
    } else if (isSwitchingToChild) {
      // Parent en train de basculer vers un enfant → laisser passer
    } else if (user.role === 'parent' && !inParent) {
      router.replace('/(parent)/dashboard');
    } else if (user.role === 'child' && !inChild) {
      router.replace('/(child)/home');
    }
  }, [user, loading, segments[0]]);

  // Pendant le chargement du token, afficher un spinner plutôt que de flasher login
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgScreen, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
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
