import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ParentLayout() {
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
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === Colors.gold ? 1 : 0.4 }}>{emoji}</Text>;
}
