import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import PixelText from '@/components/ui/PixelText';

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
          borderTopWidth: 2,
          height: 64 + bottom,
          paddingBottom: bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.pixel },
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
  const isActive = color === gold;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <PixelText style={{ fontSize: 22, opacity: isActive ? 1 : 0.4 }}>{emoji}</PixelText>
      <View style={{ width: 4, height: 4, backgroundColor: isActive ? gold : 'transparent', borderRadius: 0 }} />
    </View>
  );
}
