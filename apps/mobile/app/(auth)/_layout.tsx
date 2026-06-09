import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({ headerShown: false, contentStyle: { backgroundColor: colors.bgScreen } }),
    [colors],
  );
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="child-select" />
      <Stack.Screen name="child-pin" />
    </Stack>
  );
}
