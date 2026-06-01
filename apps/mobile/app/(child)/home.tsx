import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useState, useCallback } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import TaskCompleteSheet from '@/components/ui/TaskCompleteSheet';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { tasksApi, Task } from '@/lib/api/tasks';
import { transactionsApi } from '@/lib/api/transactions';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';
import { XP_BY_DIFFICULTY, getXpProgress, type ChildClass, CLASS_EMOJI } from '@/lib/rpg';

type TaskState = 'todo' | 'pending' | 'done';
interface UITask {
  id: string; name: string; gold: number; xp: number; state: TaskState;
  rejectionReason?: string; timesPerDay: number; completedToday: number; bonusGold: number;
}

function apiStatusToState(status: string): TaskState {
  if (status === 'validated')        return 'done';
  if (status === 'pending_approval') return 'pending';
  return 'todo';
}

function taskToUI(task: Task): UITask {
  return {
    id:    task.id,
    name:  task.title,
    gold:  task.goldReward,
    xp:    XP_BY_DIFFICULTY[task.difficulty] ?? 10,
    state: apiStatusToState(task.status),
    rejectionReason: task.rejectionReason,
    timesPerDay:     task.timesPerDay ?? 1,
    completedToday:  task.completedToday ?? 0,
    bonusGold:       task.bonusGold ?? 0,
  };
}

export default function ChildHomeScreen() {
  const { fromParent } = useLocalSearchParams<{ fromParent?: string }>();
  const { user, switchToParent } = useAuth();

  const { data: tasksData,   loading: tasksLoading,   error: tasksError,   refresh: refreshTasks }   = useApiData(() => tasksApi.list(user?.id), [user?.id]);
  const { data: balanceData, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useApiData(() => transactionsApi.getBalance(user?.id ?? ''), [user?.id]);
  const { data: streakData,  loading: streakLoading,  error: streakError,  refresh: refreshStreak }  = useApiData(() => transactionsApi.getStreak(user?.id ?? ''), [user?.id]);
  const { data: statsData,   refresh: refreshStats }  = useApiData(() => childrenApi.get(user?.id ?? ''), [user?.id]);
  const { data: rewardsData } = useApiData(() => rewardsApi.list(), []);

  useFocusEffect(useCallback(() => {
    refreshTasks(); refreshBalance(); refreshStreak(); refreshStats();
  }, []));

  const [selectedTask, setSelectedTask] = useState<UITask | null>(null);
  const ptsAnim = useRef(new Animated.Value(1)).current;

  const tasks: UITask[] = (tasksData ?? [])
    .filter(t => t.status === 'created' || t.status === 'pending_approval')
    .map(taskToUI);

  const gold       = balanceData?.balance ?? 0;
  const streak     = streakData?.currentStreak ?? 0;
  const xp         = statsData?.xp ?? 0;
  const level      = statsData?.level ?? 1;
  const levelTitle = statsData?.levelTitle ?? 'Apprenti';
  const levelEmoji = statsData?.levelEmoji ?? '🧒';
  const childClass = (statsData?.class ?? 'warrior') as ChildClass;

  const xpProgress = getXpProgress(xp);
  const xpPct = Math.round((xpProgress.current / xpProgress.total) * 100);

  const nextReward = (rewardsData ?? [])
    .filter(r => r.status === 'available' && r.cost > gold)
    .sort((a, b) => a.cost - b.cost)[0]
    ?? (rewardsData ?? []).sort((a, b) => a.cost - b.cost)[0];
  const nextRewardName  = nextReward?.title ?? '—';
  const nextRewardCost  = nextReward?.cost ?? 100;
  const nextRewardEmoji = nextReward?.emoji ?? '🎁';
  const goldProgress    = nextRewardCost > 0 ? Math.min(1, gold / nextRewardCost) : 1;
  const doneCount       = tasks.filter(t => t.state === 'done').length;

  const earnedTotal    = balanceData?.earnedTotal ?? 0;
  const longestStreak  = streakData?.longestStreak ?? 0;
  const tasksCompleted = statsData?.stats?.tasksCompleted ?? 0;
  const rewardsClaimed = statsData?.stats?.rewardsClaimed ?? 0;

  const allObjectives = [
    { emoji: '🥉', label: '100 pièces gagnées',  current: earnedTotal,    target: 100  },
    { emoji: '🥈', label: '500 pièces gagnées',  current: earnedTotal,    target: 500  },
    { emoji: '🥇', label: '1 000 pièces',        current: earnedTotal,    target: 1000 },
    { emoji: '👑', label: '1 500 pièces',        current: earnedTotal,    target: 1500 },
    { emoji: '🌱', label: 'Série de 3 jours',    current: longestStreak,  target: 3    },
    { emoji: '🔥', label: 'Série de 5 jours',    current: longestStreak,  target: 5    },
    { emoji: '⚡', label: 'Série de 10 jours',   current: longestStreak,  target: 10   },
    { emoji: '💎', label: 'Série de 30 jours',   current: longestStreak,  target: 30   },
    { emoji: '💪', label: '10 quêtes faites',    current: tasksCompleted, target: 10   },
    { emoji: '🏅', label: '25 quêtes faites',    current: tasksCompleted, target: 25   },
    { emoji: '🏆', label: '50 quêtes faites',    current: tasksCompleted, target: 50   },
    { emoji: '🎊', label: '3 récompenses',       current: rewardsClaimed, target: 3    },
    { emoji: '🎉', label: '5 récompenses',       current: rewardsClaimed, target: 5    },
    { emoji: '🚀', label: '10 récompenses',      current: rewardsClaimed, target: 10   },
  ];
  const nextObjectives = allObjectives
    .filter(o => o.current < o.target)
    .map(o => ({ ...o, progress: Math.min(1, o.current / o.target) }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  function bumpPts() {
    Animated.sequence([
      Animated.spring(ptsAnim, { toValue: 1.08, useNativeDriver: true, speed: 40 }),
      Animated.spring(ptsAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
  }

  async function submitTask(id: string, note: string, photoUri?: string) {
    setSelectedTask(null);
    try {
      await tasksApi.complete(id, note, photoUri);
    } catch {}
    finally {
      refreshTasks(); refreshBalance(); refreshStreak(); refreshStats();
      bumpPts();
    }
  }

  if (tasksLoading || balanceLoading || streakLoading) return <LoadingScreen />;
  if (tasksError)   return <ErrorScreen message={tasksError}   onRetry={refreshTasks} />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (streakError)  return <ErrorScreen message={streakError}  onRetry={refreshStreak} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: user?.color ?? Colors.gold, shadowColor: user?.color ?? Colors.gold }]}>
              <Text style={styles.avatarEmoji}>{user?.avatar ?? '🦊'}</Text>
            </View>
            <View>
              <Text style={styles.greetingSub}>Bonjour,</Text>
              <Text style={styles.greetingName}>{user?.name ?? 'Aventurier'} 👋</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.parentBtn}
            onPress={async () => { const ok = await switchToParent(); router.replace(ok ? '/(parent)/dashboard' : '/(auth)/login'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.parentBtnLabel}>Espace parent</Text>
            <Text style={styles.parentBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Carte héro : niveau + XP */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} pointerEvents="none" />

          {/* Ligne niveau */}
          <View style={styles.levelRow}>
            <Text style={styles.levelEmoji}>{levelEmoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.levelMeta}>
                <Text style={styles.levelBadge}>NIV. {level}</Text>
                <Text style={styles.levelTitle}>{levelTitle}</Text>
                <Text style={styles.classTag}>{CLASS_EMOJI[childClass]}</Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
              </View>
              <Text style={styles.xpLabel}>{xpProgress.current} / {xpProgress.total} XP</Text>
            </View>
          </View>

          {/* Séparateur */}
          <View style={styles.heroDivider} />

          {/* Or */}
          <Text style={styles.ptsLabel}>🪙 Pièces d'or</Text>
          <View style={styles.ptsRow}>
            <Animated.Text style={[styles.ptsValue, { transform: [{ scale: ptsAnim }] }]}>{gold}</Animated.Text>
            <Text style={styles.ptsSuffix}>pièces</Text>
          </View>

          {/* Prochain marchand */}
          <View style={styles.progressWrap}>
            <Text style={{ fontSize: 18 }}>{nextRewardEmoji}</Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressName}>{nextRewardName}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(goldProgress * 100)}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPct}>{Math.round(goldProgress * 100)}%</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.streak}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakNum}>{streak} jours</Text>
            <Text style={styles.streakSub}>consécutifs — continue ! 💪</Text>
          </View>
          <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>Série</Text></View>
        </View>

        {/* Prochains objectifs */}
        {nextObjectives.length > 0 && (
          <View style={styles.objectivesWrap}>
            <Text style={styles.objectivesTitle}>🎯 PROCHAINS OBJECTIFS</Text>
            {nextObjectives.map(obj => (
              <View key={obj.label} style={styles.objectiveRow}>
                <Text style={styles.objectiveEmoji}>{obj.emoji}</Text>
                <View style={styles.objectiveInfo}>
                  <View style={styles.objectiveMeta}>
                    <Text style={styles.objectiveLabel}>{obj.label}</Text>
                    <Text style={styles.objectiveCount}>{obj.current}/{obj.target}</Text>
                  </View>
                  <View style={styles.objectiveTrack}>
                    <View style={[styles.objectiveFill, { width: `${Math.round(obj.progress * 100)}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quêtes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUÊTES DU JOUR</Text>
          <Text style={styles.sectionCount}>{doneCount}/{tasks.length}</Text>
        </View>

        {tasks.length === 0 && (
          <View style={styles.emptyTasks}>
            <Text style={styles.emptyTasksEmoji}>{levelEmoji}</Text>
            <Text style={styles.emptyTasksTitle}>Aucune quête pour l'instant !</Text>
            <Text style={styles.emptyTasksSub}>Ton gardien va bientôt te confier des aventures. Prépare-toi ! ⚔️</Text>
          </View>
        )}

        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, task.state === 'done' && styles.taskDone, task.state === 'pending' && styles.taskPending]}
            onPress={() => task.state === 'todo' && setSelectedTask(task)}
            activeOpacity={task.state === 'todo' ? 0.75 : 1}
            disabled={task.state !== 'todo'}
          >
            <View style={[styles.checkbox, task.state === 'done' && styles.checkDone, task.state === 'pending' && styles.checkPending]}>
              <Text style={{ fontSize: task.state === 'pending' ? 12 : 14 }}>
                {task.state === 'done' ? '✓' : task.state === 'pending' ? '⏳' : ''}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskName, task.state === 'done' && styles.taskNameDone]}>{task.name}</Text>
              {task.state === 'pending' && <Text style={styles.taskSub}>Ton gardien vérifie bientôt ! 🤞</Text>}
              {task.state === 'todo' && task.rejectionReason != null && (
                <Text style={styles.taskRejected}>↩ {task.rejectionReason || 'Réessaie, tu peux le faire !'}</Text>
              )}
            </View>
            {task.timesPerDay > 1 && (
              <View style={styles.repBadge}>
                <Text style={styles.repBadgeText}>{task.completedToday}/{task.timesPerDay}</Text>
              </View>
            )}
            <View style={[styles.rewardBadge, task.state === 'done' && styles.rewardBadgeDone]}>
              <Text style={[styles.rewardText, task.state === 'done' && styles.rewardTextDone]}>
                +{task.gold} 🪙
              </Text>
              <Text style={styles.rewardXp}>+{task.xp} ⭐</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <TaskCompleteSheet
        task={selectedTask}
        onConfirm={(id, note, photo) => submitTask(id, note, photo)}
        onClose={() => setSelectedTask(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgScreen },
  scroll: { paddingBottom: 20 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingTop: 12 },
  avatarRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.4, shadowRadius: 8 },
  avatarEmoji: { fontSize: 24 },
  greetingSub:  { fontSize: 13, fontWeight: '600', color: Colors.textDim },
  greetingName: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  parentBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  parentBtnLabel: { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  parentBtnArrow: { fontSize: 18, color: Colors.textFaint, fontWeight: '300' },

  hero: {
    marginHorizontal: Spacing.screen, backgroundColor: Colors.bgHero,
    borderRadius: Radii.hero, padding: 18, borderWidth: 1, borderColor: Colors.borderGold,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16,
  },
  heroGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,184,0,0.06)' },

  levelRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  levelEmoji: { fontSize: 36 },
  levelMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  levelBadge:{ fontSize: 11, fontWeight: '900', color: Colors.gold, letterSpacing: 1 },
  levelTitle:{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  classTag:  { fontSize: 14 },
  xpTrack:   { height: 5, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  xpFill:    { height: '100%', borderRadius: Radii.pill, backgroundColor: Colors.gold },
  xpLabel:   { fontSize: 10, fontWeight: '700', color: Colors.textFaint, marginTop: 4 },

  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 14 },

  ptsLabel:  { fontSize: 11, fontWeight: '700', color: Colors.textDim, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  ptsRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 2 },
  ptsValue:  { fontSize: 56, fontWeight: '900', color: Colors.gold, lineHeight: 52, letterSpacing: -2 },
  ptsSuffix: { fontSize: 18, fontWeight: '700', color: Colors.goldDim, marginBottom: 4 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 12 },
  progressInfo: { flex: 1 },
  progressName: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.75)' },
  progressTrack:{ height: 6, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radii.pill, backgroundColor: Colors.gold },
  progressPct:  { fontSize: 14, fontWeight: '900', color: Colors.gold },

  streak: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.screen, marginTop: 12, backgroundColor: Colors.bgStreak, borderRadius: 20, padding: 13, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)' },
  streakNum: { fontSize: 20, fontWeight: '900', color: Colors.orange, lineHeight: 22 },
  streakSub: { fontSize: 11, fontWeight: '600', color: Colors.textFaint, marginTop: 1 },
  streakBadge: { backgroundColor: 'rgba(255,107,53,0.12)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.22)', borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  streakBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.orange, textTransform: 'uppercase', letterSpacing: 0.6 },

  objectivesWrap:  { marginHorizontal: Spacing.screen, marginTop: 12, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 12 },
  objectivesTitle: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, letterSpacing: 1.2 },
  objectiveRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  objectiveEmoji:  { fontSize: 22, width: 28, textAlign: 'center' },
  objectiveInfo:   { flex: 1, gap: 5 },
  objectiveMeta:   { flexDirection: 'row', justifyContent: 'space-between' },
  objectiveLabel:  { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  objectiveCount:  { fontSize: 12, fontWeight: '700', color: Colors.textFaint },
  objectiveTrack:  { height: 5, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  objectiveFill:   { height: '100%', borderRadius: Radii.pill, backgroundColor: Colors.gold },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: 18, marginBottom: 10 },
  sectionTitle:  { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionCount:  { fontSize: 12, fontWeight: '700', color: Colors.textFaint },

  emptyTasks:      { alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: 8, marginBottom: 16, padding: 28, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  emptyTasksEmoji: { fontSize: 40 },
  emptyTasksTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  emptyTasksSub:   { fontSize: 13, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 18 },

  taskCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: Spacing.screen, marginBottom: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  taskDone:    { backgroundColor: Colors.bgCardDone,    borderColor: 'rgba(76,175,80,0.2)' },
  taskPending: { backgroundColor: Colors.bgCardPending, borderColor: 'rgba(255,184,0,0.2)' },

  checkbox:     { width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  checkDone:    { backgroundColor: Colors.green, borderColor: Colors.green },
  checkPending: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.35)' },

  taskName:     { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  taskNameDone: { color: 'rgba(255,255,255,0.22)', textDecorationLine: 'line-through', fontWeight: '700' },
  taskSub:      { fontSize: 11, fontWeight: '700', color: 'rgba(255,184,0,0.7)', marginTop: 2 },
  taskRejected: { fontSize: 11, fontWeight: '700', color: 'rgba(239,83,80,0.8)', marginTop: 2 },

  repBadge:     { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
  repBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },

  rewardBadge:     { alignItems: 'flex-end', gap: 2 },
  rewardBadgeDone: { opacity: 0.45 },
  rewardText:      { fontSize: 13, fontWeight: '900', color: Colors.gold },
  rewardTextDone:  { color: Colors.greenDim },
  rewardXp:        { fontSize: 12, fontWeight: '800', color: '#a78bfa' },
});
