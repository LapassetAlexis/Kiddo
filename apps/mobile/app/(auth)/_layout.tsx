import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgScreen } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="child-select" />
      <Stack.Screen name="child-pin" />
    </Stack>
  );
}
