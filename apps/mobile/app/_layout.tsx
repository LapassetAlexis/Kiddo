import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={Colors.bgScreen} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgScreen } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(child)" />
        <Stack.Screen name="(parent)" />
      </Stack>
    </AuthProvider>
  );
}
