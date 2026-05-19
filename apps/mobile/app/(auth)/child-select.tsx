import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
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

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onRetry={refresh} />;

  const children: Child[] = childrenData ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>C'est qui ? 👋</Text>
        <Text style={styles.sub}>Choisis ton avatar</Text>
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
            <Text style={styles.emoji}>{child.avatar}</Text>
            <Text style={styles.name}>{child.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.parentLink}
        onPress={() => fromParent === 'true' ? router.replace('/(parent)/dashboard') : router.back()}
      >
        <Text style={styles.parentLinkText}>
          {fromParent === 'true' ? '← Retour tableau de bord' : '← Connexion parent'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
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
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    width: 150,
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 52,
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  parentLink: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  parentLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDim,
  },
});
