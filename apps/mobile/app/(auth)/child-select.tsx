import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { childrenApi, Child } from '@/lib/api/children';

export default function ChildSelectScreen() {
  const { fromParent } = useLocalSearchParams<{ fromParent?: string }>();

  const {
    data: childrenData,
    loading,
    error,
    refresh,
  } = useApiData(() => childrenApi.list(), []);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onRetry={refresh} />;

  const children: Child[] = childrenData ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PixelText style={styles.title}>C'est qui ? 👋</PixelText>
        <PixelText style={styles.sub}>Choisis ton avatar</PixelText>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {children.map(child => (
          <TouchableOpacity
            key={child.id}
            style={styles.card}
            onPress={() => router.push({
              pathname: '/(auth)/child-pin',
              params: { childId: child.id, name: child.name, fromParent },
            })}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: (child.color ?? '#FFB300') + '33', borderColor: (child.color ?? '#FFB300') + '88' }]}>
              <PixelText style={styles.emoji}>{child.avatar}</PixelText>
            </View>
            <PixelText style={styles.name}>{child.name}</PixelText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.parentLink}
        onPress={() => fromParent === 'true' ? router.replace('/(parent)/dashboard') : router.back()}
      >
        <PixelText style={styles.parentLinkText}>
          {fromParent === 'true' ? '← Retour tableau de bord' : '← Connexion parent'}
        </PixelText>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    paddingHorizontal: Spacing.screen,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 15,
    color: colors.textDim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    width: 150,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: {
    fontSize: 44,
  },
  name: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  parentLink: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  parentLinkText: {
    fontSize: 14,
    color: colors.textDim,
  },
});
