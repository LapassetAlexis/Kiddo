import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Image, useWindowDimensions,
} from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import TaskCompleteSheet from '@/components/ui/TaskCompleteSheet';
import LevelUpModal from '@/components/LevelUpModal';
import HeroSprite from '@/components/HeroSprite';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { tasksApi, Task } from '@/lib/api/tasks';
import { transactionsApi } from '@/lib/api/transactions';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';
import { XP_BY_DIFFICULTY, getXpProgress, type ChildClass } from '@/lib/rpg';
import {
  getPresetById, getUnlockedChapters, getEquippedItems,
  getEquippedBehindItems, DEFAULT_PRESET,
} from '@/lib/character-presets';

// ── Chapter backgrounds ──────────────────────────────────────────────────────
const BG_BY_CHAPTER = [
  require('@/assets/sprites/bg_forest.png'),
  require('@/assets/sprites/bg_ch2.png'),
  require('@/assets/sprites/bg_ch3.png'),
  require('@/assets/sprites/bg_ch4.png'),
  require('@/assets/sprites/bg_ch5.png'),
];
const BG_NATIVE_W = 128;
const BG_NATIVE_H = 160;
const SCENE_H     = 220;
const SPRITE_SIZE = 80;
const GROUND_OFF  = -4;

// ── HeroScene ────────────────────────────────────────────────────────────────
function HeroScene({ preset, level, chapterIndex }: {
  preset: ReturnType<typeof getPresetById> & {};
  level: number;
  chapterIndex: number;
}) {
  const { width } = useWindowDimensions();
  const tileW  = Math.ceil((BG_NATIVE_W / BG_NATIVE_H) * SCENE_H);
  const copies = Math.ceil((width * 2) / tileW) + 1;
  const totalW = copies * tileW;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -tileW, duration: 4000,
        easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();
  }, [tileW]);

  return (
    <View style={[styles.scene, { height: SCENE_H }]}>
      <Animated.View style={[styles.bgRow, { width: totalW, transform: [{ translateX: scrollX }] }]}>
        {Array.from({ length: copies }).map((_, i) => (
          <Image
            key={i}
            source={BG_BY_CHAPTER[Math.min(chapterIndex, BG_BY_CHAPTER.length - 1)]}
            style={{ width: tileW, height: SCENE_H }}
            resizeMode="stretch"
          />
        ))}
      </Animated.View>
      <View style={styles.sceneGradient} />
      <View style={styles.spriteAnchor}>
        <HeroSprite
          source={preset.baseStrip}
          items={getEquippedItems(preset, level)}
          behindItems={getEquippedBehindItems(preset, level)}
          size={SPRITE_SIZE}
          direction="right"
        />
      </View>
    </View>
  );
}

// ── Task types ────────────────────────────────────────────────────────────────
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
    id: task.id, name: task.title, gold: task.goldReward,
    xp: XP_BY_DIFFICULTY[task.difficulty] ?? 10,
    state: apiStatusToState(task.status),
    rejectionReason: task.rejectionReason,
    timesPerDay: task.timesPerDay ?? 1,
    completedToday: task.completedToday ?? 0,
    bonusGold: task.bonusGold ?? 0,
  };
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChildHomeScreen() {
  const { fromParent } = useLocalSearchParams<{ fromParent?: string }>();
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();

  const { data: tasksData,   loading: tasksLoading,   error: tasksError,   refresh: refreshTasks }   = useApiData(() => tasksApi.list(user?.id), [user?.id]);
  const { data: balanceData, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useApiData(() => transactionsApi.getBalance(user?.id ?? ''), [user?.id]);
  const { data: streakData,  loading: streakLoading,  error: streakError,  refresh: refreshStreak }  = useApiData(() => transactionsApi.getStreak(user?.id ?? ''), [user?.id]);
  const { data: statsData,   refresh: refreshStats }  = useApiData(() => childrenApi.get(user?.id ?? ''), [user?.id]);

  useFocusEffect(useCallback(() => {
    refreshTasks(); refreshBalance(); refreshStreak(); refreshStats();
  }, []));

  useEffect(() => {
    if (statsData?.pendingLevelUp) setLevelUpData({ level: statsData.pendingLevelUp });
  }, [statsData?.pendingLevelUp]);

  const [selectedTask, setSelectedTask] = useState<UITask | null>(null);
  const [levelUpData, setLevelUpData]   = useState<{ level: number } | null>(null);
  const ptsAnim = useRef(new Animated.Value(1)).current;

  // ── Derived ────────────────────────────────────────────────────────────────
  const tasks    = (tasksData ?? []).filter(t => t.status === 'created' || t.status === 'pending_approval').map(taskToUI);
  const gold     = balanceData?.balance ?? 0;
  const streak   = streakData?.currentStreak ?? 0;
  const xp       = statsData?.xp ?? 0;
  const level    = statsData?.level ?? 1;
  const xpProgress = getXpProgress(xp);
  const xpPct    = Math.round((xpProgress.current / xpProgress.total) * 100);
  const doneCount = tasks.filter(t => t.state === 'done').length;

  // Sprite / chapters
  const childSprite = statsData?.sprite ?? DEFAULT_PRESET;
  const preset      = getPresetById(childSprite) ?? getPresetById(DEFAULT_PRESET)!;
  const unlocked    = getUnlockedChapters(preset, level);
  const locked      = preset.chapters.filter(c => level < c.minLevel);

  // Level objective
  const goalLevel  = statsData?.levelGoal ?? null;
  const goalReward = statsData?.levelGoalReward ?? null;
  const goalPct = goalLevel && goalLevel > level
    ? Math.min(100, Math.round((xp / (() => {
        let t = 0; for (let l = 1; l < goalLevel; l++) t += Math.floor(50 * Math.pow(l, 1.6)); return t;
      })()) * 100))
    : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function bumpPts() {
    Animated.sequence([
      Animated.spring(ptsAnim, { toValue: 1.08, useNativeDriver: true, speed: 40 }),
      Animated.spring(ptsAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
  }

  async function dismissLevelUp() {
    setLevelUpData(null);
    if (user?.id) { try { await childrenApi.ackLevelUp(user.id); } catch {} }
  }

  async function submitTask(id: string, note: string, photoUri?: string) {
    setSelectedTask(null);
    try { await tasksApi.complete(id, note, photoUri); } catch {}
    finally { refreshTasks(); refreshBalance(); refreshStreak(); refreshStats(); bumpPts(); }
  }

  if (tasksLoading || balanceLoading || streakLoading) return <LoadingScreen />;
  if (tasksError)   return <ErrorScreen message={tasksError}   onRetry={refreshTasks} />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (streakError)  return <ErrorScreen message={streakError}  onRetry={refreshStreak} />;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Zone héros ── */}
        <View style={styles.heroZone}>
          <HeroScene preset={preset} level={level} chapterIndex={unlocked.length - 1} />

          {/* HUD top: Nom + Gold */}
          <View style={[styles.hudTop, { top: top + 8 }]}>
            <View style={styles.namePill}>
              <Text style={styles.namePillText}>{user?.name ?? 'Aventurier'}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.goldChip}>
              <Animated.Text style={[styles.goldChipText, { transform: [{ scale: ptsAnim }] }]}>🪙 {gold}</Animated.Text>
            </View>
          </View>

          {/* XP bar flottante au-dessus du sprite */}
          <View style={styles.spriteHud}>
            <View style={styles.spriteHudRow}>
              <Text style={styles.spriteLevel}>NIV. {level}</Text>
              {streak > 0 && <Text style={styles.spriteStreak}>🔥 {streak}j</Text>}
            </View>
            <View style={styles.spriteXpTrack}>
              <View style={[styles.spriteXpFill, { width: `${xpPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Objectif de niveau */}
        {goalLevel !== null && goalPct !== null && (
          <View style={styles.goalBanner}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>Objectif niveau {goalLevel}</Text>
                {goalReward && <Text style={styles.goalReward}>{goalReward}</Text>}
              </View>
              <Text style={styles.goalPct}>{goalPct}%</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${goalPct}%` }]} />
            </View>
          </View>
        )}

        {/* ── Quêtes ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUÊTES DU JOUR</Text>
          <Text style={styles.sectionCount}>{doneCount}/{tasks.length}</Text>
        </View>

        {tasks.length === 0 && (
          <View style={styles.emptyTasks}>
            <Text style={styles.emptyTasksTitle}>Aucune quête pour l'instant !</Text>
            <Text style={styles.emptyTasksSub}>Ton gardien va bientôt te confier des aventures. ⚔️</Text>
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
              <Text style={[styles.rewardText, task.state === 'done' && styles.rewardTextDone]}>+{task.gold} 🪙</Text>
              <Text style={styles.rewardXp}>+{task.xp} ⭐</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Histoire ── */}
        {(unlocked.length > 0 || locked.length > 0) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>HISTOIRE</Text>
            </View>
            {unlocked.map((chapter, i) => (
              <View key={chapter.title} style={styles.chapterCard}>
                <View style={styles.chapterHeaderRow}>
                  <View style={styles.chapterBadge}>
                    <Text style={styles.chapterBadgeText}>Chapitre {i + 1}</Text>
                  </View>
                  <Text style={styles.chapterMinLevel}>Niv. {chapter.minLevel}</Text>
                </View>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterText}>{chapter.text}</Text>
              </View>
            ))}
            {locked.slice(0, 2).map(chapter => (
              <View key={chapter.title} style={styles.chapterLocked}>
                <Text style={styles.lockIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterTitleLocked}>{chapter.title}</Text>
                  <Text style={styles.lockHint}>Se débloque au niveau {chapter.minLevel}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <TaskCompleteSheet
        task={selectedTask}
        onConfirm={(id, note, photo) => submitTask(id, note, photo)}
        onClose={() => setSelectedTask(null)}
      />
      <LevelUpModal
        visible={levelUpData !== null}
        newLevel={levelUpData?.level ?? 1}
        childClass={(statsData?.class ?? 'warrior') as ChildClass}
        childName={user?.name ?? 'Aventurier'}
        onClose={dismissLevelUp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgScreen },
  scroll: { paddingBottom: 20 },

  // ── Hero zone ──────────────────────────────────────────────────────────────
  heroZone:     { position: 'relative' },
  scene:        { overflow: 'hidden', backgroundColor: '#0a1a0a' },
  bgRow:        { position: 'absolute', top: 0, left: 0, bottom: 0, flexDirection: 'row' },
  sceneGradient:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.55)' },
  spriteAnchor: { position: 'absolute', bottom: GROUND_OFF, left: '50%', marginLeft: -(SPRITE_SIZE / 2) },

  hudTop:       { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  namePill:     { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  namePillText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  goldChip:     { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  goldChipText: { fontSize: 12, fontWeight: '900', color: Colors.gold },

  // XP bar au-dessus du sprite
  spriteHud:     { position: 'absolute', bottom: GROUND_OFF + SPRITE_SIZE + 8, left: '50%', marginLeft: -80, width: 160, gap: 2 },
  spriteHudRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spriteLevel:   { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  spriteStreak:  { fontSize: 9, fontWeight: '800', color: Colors.orange },
  spriteXpTrack: { height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  spriteXpFill:  { height: '100%', borderRadius: 99, backgroundColor: Colors.gold },

  // ── Objectif ──────────────────────────────────────────────────────────────
  goalBanner:  { marginHorizontal: Spacing.screen, marginTop: 12, backgroundColor: 'rgba(255,184,0,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', gap: 8 },
  goalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalIcon:    { fontSize: 18 },
  goalTitle:   { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  goalReward:  { fontSize: 11, fontWeight: '600', color: Colors.textDim, marginTop: 1 },
  goalPct:     { fontSize: 14, fontWeight: '900', color: Colors.gold },
  goalTrack:   { height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  goalFill:    { height: '100%', borderRadius: 99, backgroundColor: Colors.gold },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: 18, marginBottom: 10 },
  sectionTitle:  { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionCount:  { fontSize: 12, fontWeight: '700', color: Colors.textFaint },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  emptyTasks:    { alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: 4, marginBottom: 12, padding: 24, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  emptyTasksTitle:{ fontSize: 15, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  emptyTasksSub: { fontSize: 12, fontWeight: '600', color: Colors.textDim, textAlign: 'center' },

  taskCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: Spacing.screen, marginBottom: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  taskDone:    { backgroundColor: Colors.bgCardDone,    borderColor: 'rgba(76,175,80,0.2)' },
  taskPending: { backgroundColor: Colors.bgCardPending, borderColor: 'rgba(255,184,0,0.2)' },
  checkbox:    { width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  checkDone:   { backgroundColor: Colors.green, borderColor: Colors.green },
  checkPending:{ backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.35)' },
  taskName:    { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  taskNameDone:{ color: 'rgba(255,255,255,0.22)', textDecorationLine: 'line-through', fontWeight: '700' },
  taskSub:     { fontSize: 11, fontWeight: '700', color: 'rgba(255,184,0,0.7)', marginTop: 2 },
  taskRejected:{ fontSize: 11, fontWeight: '700', color: 'rgba(239,83,80,0.8)', marginTop: 2 },
  repBadge:    { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
  repBadgeText:{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  rewardBadge:    { alignItems: 'flex-end', gap: 2 },
  rewardBadgeDone:{ opacity: 0.45 },
  rewardText:     { fontSize: 13, fontWeight: '900', color: Colors.gold },
  rewardTextDone: { color: Colors.greenDim },
  rewardXp:       { fontSize: 12, fontWeight: '800', color: '#a78bfa' },

  // ── Histoire ──────────────────────────────────────────────────────────────
  chapterCard:      { marginHorizontal: Spacing.screen, marginBottom: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 8 },
  chapterHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chapterBadge:     { backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' },
  chapterBadgeText: { fontSize: 11, fontWeight: '900', color: Colors.gold },
  chapterMinLevel:  { fontSize: 11, fontWeight: '700', color: Colors.textFaint },
  chapterTitle:     { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  chapterText:      { fontSize: 14, fontWeight: '500', color: Colors.textDim, lineHeight: 22 },
  chapterLocked:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: Spacing.screen, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: Radii.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', padding: 14 },
  lockIcon:         { fontSize: 20 },
  chapterTitleLocked:{ fontSize: 14, fontWeight: '800', color: Colors.textFaint },
  lockHint:         { fontSize: 11, fontWeight: '600', color: Colors.textFaint, marginTop: 2, opacity: 0.6 },
});
