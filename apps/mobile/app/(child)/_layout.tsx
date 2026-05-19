import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgNav,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Accueil',      tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="rewards"  options={{ title: 'Récompenses',  tabBarIcon: ({ color }) => <TabIcon emoji="🎁" color={color} /> }} />
      <Tabs.Screen name="history"  options={{ title: 'Historique',   tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profil',       tabBarIcon: ({ color }) => <TabIcon emoji="🦊" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === Colors.gold ? 1 : 0.4 }}>{emoji}</Text>;
}
