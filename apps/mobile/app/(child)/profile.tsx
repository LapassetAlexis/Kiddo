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
import { getXpProgress, CLASS_LABELS } from '@/lib/rpg';
import type { ChildClass } from '@/lib/rpg';
import HeroSprite from '@/components/HeroSprite';
import { DEFAULT_PRESET, getPresetById, getEquippedItems } from '@/lib/character-presets';

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
        { id: 'o2', emoji: '🏆', label: 'Première quête',       unlocked: tasksCompleted >= 1 },
        { id: 'o3', emoji: '🎁', label: 'Première récompense',  unlocked: rewardsClaimed >= 1 },
        { id: 'o4', emoji: '🔥', label: 'Première série',       unlocked: longestStreak >= 2  },
      ],
    },
    {
      title: '🪙 Pièces gagnées',
      badges: [
        { id: 'p1', emoji: '🥉', label: '100 🪙',    unlocked: earnedTotal >= 100  },
        { id: 'p2', emoji: '🥈', label: '500 🪙',    unlocked: earnedTotal >= 500  },
        { id: 'p3', emoji: '🥇', label: '1 000 🪙',  unlocked: earnedTotal >= 1000 },
        { id: 'p4', emoji: '👑', label: '1 500 🪙',  unlocked: earnedTotal >= 1500 },
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
      title: '⚔️ Quêtes',
      badges: [
        { id: 't1', emoji: '🎯', label: '1 quête',    unlocked: tasksCompleted >= 1  },
        { id: 't2', emoji: '💪', label: '10 quêtes',  unlocked: tasksCompleted >= 10 },
        { id: 't3', emoji: '🏅', label: '25 quêtes',  unlocked: tasksCompleted >= 25 },
        { id: 't4', emoji: '🏆', label: '50 quêtes',  unlocked: tasksCompleted >= 50 },
      ],
    },
    {
      title: '🎁 Récompenses',
      badges: [
        { id: 'r1', emoji: '🎀', label: '1 récompense',   unlocked: rewardsClaimed >= 1  },
        { id: 'r2', emoji: '🎊', label: '3 récompenses',  unlocked: rewardsClaimed >= 3  },
        { id: 'r3', emoji: '🎉', label: '5 récompenses',  unlocked: rewardsClaimed >= 5  },
        { id: 'r4', emoji: '🚀', label: '10 récompenses', unlocked: rewardsClaimed >= 10 },
      ],
    },
  ];
}

export default function ChildProfileScreen() {
  const { user, canSwitchToParent, switchToParent: authSwitchToParent } = useAuth();
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

  const childName       = statsData?.name       ?? user?.name   ?? '';
  const childEmoji      = statsData?.avatar     ?? user?.avatar ?? '🧒';
  const childSprite     = statsData?.sprite     ?? DEFAULT_PRESET;
  const childPreset     = getPresetById(childSprite) ?? getPresetById(DEFAULT_PRESET)!;
  const childColor      = user?.color           ?? '#FFB300';
  const childXp         = statsData?.xp         ?? 0;
  const childLevel      = statsData?.level      ?? 1;
  const childTitle      = statsData?.levelTitle ?? '';
  const childLevelEmoji = statsData?.levelEmoji ?? '';
  const childClass      = (statsData?.class     ?? 'warrior') as ChildClass;
  const currentGold     = balanceData?.balance  ?? 0;
  const currentStreak   = streakData?.currentStreak  ?? 0;
  const earnedTotal     = balanceData?.earnedTotal    ?? 0;
  const spentTotal      = balanceData?.spentTotal     ?? 0;
  const longestStreak   = streakData?.longestStreak   ?? 0;
  const xpProgress      = getXpProgress(childXp);
  const xpPercent       = xpProgress.total > 0 ? Math.round((xpProgress.current / xpProgress.total) * 100) : 0;

  const BADGE_GROUPS = buildBadgeGroups(
    statsData?.stats?.tasksCompleted ?? 0,
    earnedTotal,
    spentTotal,
    longestStreak,
    statsData?.stats?.rewardsClaimed ?? 0,
  );

  const joinedDate = statsData?.createdAt
    ? new Date(statsData.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const STATS = [
    { label: 'Quêtes faites',   value: String(statsData?.stats?.tasksCompleted ?? 0), icon: '⚔️', color: Colors.green  },
    { label: 'Récompenses',     value: String(statsData?.stats?.rewardsClaimed ?? 0), icon: '🎁', color: Colors.gold   },
    { label: 'Record de série', value: `${streakData?.longestStreak ?? 0}j`,          icon: '🔥', color: Colors.orange },
    { label: 'Or gagné',        value: earnedTotal.toLocaleString('fr-FR') + ' 🪙',   icon: '💰', color: Colors.gold   },
  ];

  function changePin() {
    showModal({
      icon: '🔢',
      title: 'Changer de code',
      message: 'Demande à ton gardien de te changer ton code secret.',
      buttons: [{ label: 'OK', style: 'default' }],
    });
  }

  function switchToParent() {
    showModal({
      icon: '👨‍👩‍👧',
      title: 'Espace gardien',
      message: 'Ton gardien devra entrer son mot de passe.',
      buttons: [
        {
          label: 'Continuer',
          style: 'default',
          onPress: async () => {
            const ok = await authSwitchToParent();
            if (!ok) router.replace('/(auth)/login');
          },
        },
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
            <View style={[styles.spriteContainer, { borderColor: childColor + '66', backgroundColor: childColor + '22' }]}>
              <HeroSprite source={childPreset.baseStrip} items={getEquippedItems(childPreset, childLevel)} size={100} direction="south" />
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {currentStreak}</Text>
            </View>
          </View>
          <Text style={styles.childName}>{childName}</Text>
          {joinedDate ? <Text style={styles.childSince}>Membre depuis {joinedDate}</Text> : null}

          {/* Level + classe + XP */}
          <View style={styles.levelRow}>
            <Text style={styles.levelEmoji}>{childLevelEmoji}</Text>
            <View style={styles.levelInfo}>
              <View style={styles.levelTitleRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Niv. {childLevel}</Text>
                </View>
                <Text style={styles.levelTitle}>{childTitle}</Text>
                <Text style={styles.classChip}>{CLASS_LABELS[childClass]}</Text>
              </View>
              <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
              </View>
              <Text style={styles.xpLabel}>{xpProgress.current} / {xpProgress.total} XP</Text>
            </View>
          </View>

          {/* Or */}
          <View style={styles.balancePill}>
            <Text style={styles.balancePillText}>🪙 {currentGold} pièces d'or</Text>
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
          {canSwitchToParent && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionRow} onPress={switchToParent} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>👨‍👩‍👧</Text>
                <Text style={styles.actionText}>Espace gardien</Text>
                <Text style={styles.actionArrow}>›</Text>
              </TouchableOpacity>
            </>
          )}
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
  avatarWrap:   { position: 'relative', marginBottom: 4 },
  spriteContainer: { width: 120, height: 120, borderRadius: 24, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  streakBadge: {
    position: 'absolute', bottom: -4, right: -8,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
  },
  streakBadgeText: { fontSize: 12, fontWeight: '900', color: Colors.orange },
  childName:       { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  childSince:      { fontSize: 13, fontWeight: '600', color: Colors.textFaint },

  // Level / XP
  levelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', paddingHorizontal: 8,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  levelEmoji:    { fontSize: 36 },
  levelInfo:     { flex: 1, gap: 5 },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  levelBadgeText: { fontSize: 11, fontWeight: '900', color: '#a78bfa' },
  levelTitle:     { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  classChip:      { marginLeft: 'auto', fontSize: 12, fontWeight: '700', color: Colors.textDim },
  xpBarTrack: { height: 6, borderRadius: 99, backgroundColor: 'rgba(139,92,246,0.15)', overflow: 'hidden', width: '100%' },
  xpBarFill:  { height: '100%', borderRadius: 99, backgroundColor: '#8b5cf6' },
  xpLabel:    { fontSize: 10, fontWeight: '700', color: Colors.textFaint },

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
  actionRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  actionIcon:    { fontSize: 22 },
  actionText:    { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionArrow:   { fontSize: 20, color: Colors.textFaint },
  actionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
