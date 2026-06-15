import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Radii, Spacing, Fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PixelText from '@/components/ui/PixelText';

const makeStyles = (colors: ThemeColors) => ({
  tabBarStyle: {
    backgroundColor: colors.bgNav,
    borderTopColor: colors.border,
    borderTopWidth: 2,
  },
  tabBarActiveTintColor: colors.gold,
  tabBarInactiveTintColor: colors.textFaint,
});

export default function ParentLayout() {
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  const themed = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...themed.tabBarStyle,
          height: 64 + bottom,
          paddingBottom: bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: themed.tabBarActiveTintColor,
        tabBarInactiveTintColor: themed.tabBarInactiveTintColor,
        tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.pixel },
      }}
    >
      <Tabs.Screen name="dashboard"    options={{ title: 'Tableau de bord', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="tasks"        options={{ title: 'Quêtes',          tabBarIcon: ({ color }) => <TabIcon emoji="⚔️" color={color} /> }} />
      <Tabs.Screen name="manage"       options={{ title: 'Magasin',         tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} /> }} />
      <Tabs.Screen name="settings"     options={{ title: 'Paramètres',      tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }} />
      <Tabs.Screen name="create-child"  options={{ href: null }} />
      <Tabs.Screen name="create-task"   options={{ href: null }} />
      <Tabs.Screen name="create-reward" options={{ href: null }} />
      <Tabs.Screen name="edit-profile"  options={{ href: null }} />
      <Tabs.Screen name="edit-child"    options={{ href: null }} />
      <Tabs.Screen name="legal"         options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { colors } = useTheme();
  const isActive = color === colors.gold;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <PixelText style={{ fontSize: 22, opacity: isActive ? 1 : 0.4 }}>{emoji}</PixelText>
      <View style={{ width: 4, height: 4, backgroundColor: isActive ? colors.gold : 'transparent', borderRadius: 0 }} />
    </View>
  );
}
