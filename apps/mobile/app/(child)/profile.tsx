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

interface BadgeGroup {
  title: string;
  badges: { id: string; emoji: string; label: string; unlocked: boolean }[];
}

function buildBadgeGroups(tasksCompleted: number, earnedTotal: number, spentTotal: number, longestStreak: number, rewardsClaimed: number): BadgeGroup[] {
  return [
    {
      title: '🎯 Premiers objectifs',
      badges: [
        { id: 'o1', emoji: '🌟', label: 'Bienvenue !',          unlocked: true                },
        { id: 'o2', emoji: '🏆', label: 'Première tâche',       unlocked: tasksCompleted >= 1 },
        { id: 'o3', emoji: '🎁', label: 'Première récompense',  unlocked: rewardsClaimed >= 1 },
        { id: 'o4', emoji: '🔥', label: 'Première série',       unlocked: longestStreak >= 2  },
      ],
    },
    {
      title: '⭐ Points gagnés',
      badges: [
        { id: 'p1', emoji: '🥉', label: '100 pts',   unlocked: earnedTotal >= 100  },
        { id: 'p2', emoji: '🥈', label: '500 pts',   unlocked: earnedTotal >= 500  },
        { id: 'p3', emoji: '🥇', label: '1 000 pts', unlocked: earnedTotal >= 1000 },
        { id: 'p4', emoji: '👑', label: '1 500 pts', unlocked: earnedTotal >= 1500 },
      ],
    },
    {
      title: '🔥 Séries',
      badges: [
        { id: 's1', emoji: '🌱', label: '3 jours',  unlocked: longestStreak >= 3  },
        { id: 's2', emoji: '🔥', label: '5 jours',  unlocked: longestStreak >= 5  },
        { id: 's3', emoji: '⚡', label: '10 jours', unlocked: longestStreak >= 10 },
        { id: 's4', emoji: '💎', label: '30 jours', unlocked: longestStreak >= 30 },
      ],
    },
    {
      title: '✅ Tâches',
      badges: [
        { id: 't1', emoji: '🎯', label: '1 tâche',    unlocked: tasksCompleted >= 1  },
        { id: 't2', emoji: '💪', label: '10 tâches',  unlocked: tasksCompleted >= 10 },
        { id: 't3', emoji: '🏅', label: '25 tâches',  unlocked: tasksCompleted >= 25 },
        { id: 't4', emoji: '🏆', label: '50 tâches',  unlocked: tasksCompleted >= 50 },
      ],
    },
    {
      title: '🎁 Récompenses',
      badges: [
        { id: 'r1', emoji: '🎀', label: '1 récompense',  unlocked: rewardsClaimed >= 1  },
        { id: 'r2', emoji: '🎊', label: '3 récompenses', unlocked: rewardsClaimed >= 3  },
        { id: 'r3', emoji: '🎉', label: '5 récompenses', unlocked: rewardsClaimed >= 5  },
        { id: 'r4', emoji: '🚀', label: '10 récompenses',unlocked: rewardsClaimed >= 10 },
      ],
    },
  ];
}

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
  const spentTotal   = balanceData?.spentTotal ?? 0;
  const longestStreak= streakData?.longestStreak ?? 0;
  const BADGE_GROUPS = buildBadgeGroups(
    statsData?.tasksCompleted ?? 0,
    earnedTotal,
    spentTotal,
    longestStreak,
    statsData?.rewardsClaimed ?? 0,
  );

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
        {BADGE_GROUPS.map(group => (
          <View key={group.title} style={styles.badgeGroup}>
            <Text style={styles.badgeGroupTitle}>{group.title}</Text>
            <View style={styles.badgeRow}>
              {group.badges.map(b => (
                <View key={b.id} style={[styles.badgeCard, !b.unlocked && styles.badgeLocked]}>
                  <Text style={[styles.badgeEmoji, !b.unlocked && { opacity: 0.25 }]}>{b.emoji}</Text>
                  <Text style={[styles.badgeLabel, !b.unlocked && styles.badgeLabelLocked]}>{b.label}</Text>
                  {!b.unlocked && <Text style={styles.badgeLockIcon}>🔒</Text>}
                </View>
              ))}
            </View>
          </View>
        ))}

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
  badgeGroup:      { gap: 8 },
  badgeGroupTitle: { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  badgeRow:        { flexDirection: 'row', gap: 8 },
  badgeCard: {
    flex: 1,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 12, paddingHorizontal: 4,
    alignItems: 'center', gap: 5,
    position: 'relative',
  },
  badgeLocked:      { opacity: 0.45 },
  badgeEmoji:       { fontSize: 26 },
  badgeLabel:       { fontSize: 9, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', lineHeight: 12 },
  badgeLabelLocked: { color: Colors.textFaint },
  badgeLockIcon:    { position: 'absolute', top: 5, right: 5, fontSize: 9 },

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
