import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { childrenApi } from '@/lib/api/children';
import { transactionsApi } from '@/lib/api/transactions';

const BADGES = [
  { id: '1', emoji: '🏆', label: 'Première tâche',     unlocked: true  },
  { id: '2', emoji: '🔥', label: 'Série de 7 jours',   unlocked: true  },
  { id: '3', emoji: '⭐', label: '100 points gagnés',  unlocked: true  },
  { id: '4', emoji: '🎯', label: '10 tâches en 1 sem', unlocked: false },
  { id: '5', emoji: '💎', label: 'Série de 30 jours',  unlocked: false },
  { id: '6', emoji: '🚀', label: '500 points dépensés',unlocked: false },
];

export default function ChildProfileScreen() {
  const { user } = useAuth();
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useApiData(() => childrenApi.get(user?.id ?? ''), [user?.id]);

  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
    refresh: refreshBalance,
  } = useApiData(() => transactionsApi.getBalance(user?.id ?? ''), [user?.id]);

  const {
    data: streakData,
    loading: streakLoading,
    error: streakError,
    refresh: refreshStreak,
  } = useApiData(() => transactionsApi.getStreak(user?.id ?? ''), [user?.id]);

  if (statsLoading || balanceLoading || streakLoading) return <LoadingScreen />;
  if (statsError)   return <ErrorScreen message={statsError}   onRetry={refreshStats} />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (streakError)  return <ErrorScreen message={streakError}  onRetry={refreshStreak} />;

  const childInfo    = statsData?.child;
  const childName    = childInfo?.name ?? user?.name ?? 'Lucas';
  const childEmoji   = childInfo?.avatar ?? '🦊';
  const currentPts   = balanceData?.balance ?? 0;
  const currentStreak= streakData?.currentStreak ?? 0;
  const earnedTotal  = balanceData?.earnedTotal ?? 0;

  const joinedDate = childInfo?.createdAt
    ? new Date(childInfo.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const STATS = [
    { label: 'Tâches faites',   value: String(statsData?.tasksCompleted ?? 0),   icon: '✅', color: Colors.green  },
    { label: 'Récompenses',     value: String(statsData?.rewardsClaimed ?? 0),   icon: '🎁', color: Colors.gold   },
    { label: 'Record de série', value: `${streakData?.longestStreak ?? 0}j`,     icon: '🔥', color: Colors.orange },
    { label: 'Points gagnés',   value: earnedTotal.toLocaleString('fr-FR'),      icon: '⭐', color: Colors.gold   },
  ];

  function changePin() {
    showModal({
      icon: '🔢',
      title: 'Changer de code',
      message: 'Demande à papa ou maman de te changer ton code secret.',
      buttons: [{ label: 'OK', style: 'default' }],
    });
  }

  function switchToParent() {
    showModal({
      icon: '👨‍👩‍👧',
      title: 'Espace parent',
      message: 'Papa ou maman devra entrer son mot de passe.',
      buttons: [
        { label: 'Continuer', style: 'default', onPress: () => router.replace('/(parent)/dashboard') },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Avatar + nom */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>{childEmoji}</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {currentStreak}</Text>
            </View>
          </View>
          <Text style={styles.childName}>{childName}</Text>
          {joinedDate ? <Text style={styles.childSince}>Membre depuis {joinedDate}</Text> : null}

          {/* Balance */}
          <View style={styles.balancePill}>
            <Text style={styles.balancePillText}>⭐ {currentPts} pts</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionLabel}>Mes stats</Text>
        <View style={styles.statsGrid}>
          {STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text style={styles.sectionLabel}>Mes badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map(b => (
            <View key={b.id} style={[styles.badgeCard, !b.unlocked && styles.badgeLocked]}>
              <Text style={[styles.badgeEmoji, !b.unlocked && { opacity: 0.3 }]}>{b.emoji}</Text>
              <Text style={[styles.badgeLabel, !b.unlocked && styles.badgeLabelLocked]}>{b.label}</Text>
              {!b.unlocked && <Text style={styles.badgeLockIcon}>🔒</Text>}
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={styles.sectionLabel}>Mon compte</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={changePin} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>🔢</Text>
            <Text style={styles.actionText}>Changer mon code secret</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={switchToParent} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>👨‍👩‍👧</Text>
            <Text style={styles.actionText}>Espace parent</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgScreen },
  content: { padding: Spacing.screen, gap: 12 },

  // Hero
  heroSection: { alignItems: 'center', paddingVertical: 16, gap: 10 },
  avatarWrap:  { position: 'relative', marginBottom: 4 },
  avatarEmoji: { fontSize: 72 },
  streakBadge: {
    position: 'absolute', bottom: -4, right: -8,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
  },
  streakBadgeText: { fontSize: 12, fontWeight: '900', color: Colors.orange },
  childName:       { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  childSince:      { fontSize: 13, fontWeight: '600', color: Colors.textFaint },
  balancePill: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)',
  },
  balancePillText: { fontSize: 18, fontWeight: '900', color: Colors.gold },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4,
  },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, alignItems: 'center', gap: 6,
  },
  statIcon:  { fontSize: 28 },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  statLabel: { fontSize: 11, fontWeight: '700', color: Colors.textFaint, textAlign: 'center' },

  // Badges
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '30%',
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 6,
    position: 'relative',
  },
  badgeLocked:    { opacity: 0.5 },
  badgeEmoji:     { fontSize: 30 },
  badgeLabel:     { fontSize: 10, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', lineHeight: 13 },
  badgeLabelLocked: { color: Colors.textFaint },
  badgeLockIcon:  { position: 'absolute', top: 6, right: 6, fontSize: 10 },

  // Actions
  actionsCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  actionIcon:{ fontSize: 22 },
  actionText:{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionArrow:{ fontSize: 20, color: Colors.textFaint },
  actionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
