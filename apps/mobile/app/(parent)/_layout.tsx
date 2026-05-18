import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ParentLayout() {
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
      <Tabs.Screen name="dashboard" options={{ title: 'Tableau de bord', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="tasks"     options={{ title: 'Tâches',          tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
      <Tabs.Screen name="manage"    options={{ title: 'Récompenses',      tabBarIcon: ({ color }) => <TabIcon emoji="🎁" color={color} /> }} />
      <Tabs.Screen name="settings"  options={{ title: 'Paramètres',      tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === Colors.gold ? 1 : 0.4 }}>{emoji}</Text>;
}
