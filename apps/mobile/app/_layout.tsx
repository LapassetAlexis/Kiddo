import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/api-client';

function RootNavigator() {
  const { user, loading } = useAuth();

  // Vérifier périodiquement si le token est toujours présent
  // (il est effacé automatiquement sur 401)
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      const token = await getToken();
      if (!token && user) {
        // Token disparu alors qu'on était connecté → logout propre
        router.replace('/(auth)/login');
      }
    }, 5000); // Vérification toutes les 5s
    return () => clearInterval(interval);
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgScreen } }}>
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
