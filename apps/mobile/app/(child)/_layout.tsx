import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChildLayout() {
  const { user } = useAuth();
  const avatarEmoji = user?.avatar ?? '🧒';
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgNav,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64 + bottom,
          paddingBottom: bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Accueil',    tabBarIcon: ({ color }) => <TabIcon emoji="⚔️" color={color} /> }} />
      <Tabs.Screen name="rewards" options={{ title: 'Magasin',    tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historique', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil',     tabBarIcon: ({ color }) => <TabIcon emoji={avatarEmoji} color={color} /> }} />
      <Tabs.Screen name="avatar"  options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 22, opacity: color === Colors.gold ? 1 : 0.4 }}>{emoji}</Text>;
}
