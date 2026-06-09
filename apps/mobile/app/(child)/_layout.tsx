import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChildLayout() {
  const { user } = useAuth();
  const avatarEmoji = user?.avatar ?? '🧒';
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgNav,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + bottom,
          paddingBottom: bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Accueil',    tabBarIcon: ({ color }) => <TabIcon emoji="⚔️" color={color} gold={colors.gold} /> }} />
      <Tabs.Screen name="rewards" options={{ title: 'Magasin',    tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} gold={colors.gold} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historique', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} gold={colors.gold} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil',     tabBarIcon: ({ color }) => <TabIcon emoji={avatarEmoji} color={color} gold={colors.gold} /> }} />
      <Tabs.Screen name="avatar"  options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color, gold }: { emoji: string; color: string; gold: string }) {
  return <Text style={{ fontSize: 22, opacity: color === gold ? 1 : 0.4 }}>{emoji}</Text>;
}
