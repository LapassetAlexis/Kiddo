import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type TaskState = 'todo' | 'pending' | 'done';
interface Task { id: string; name: string; pts: number; state: TaskState; }

const INITIAL_TASKS: Task[] = [
  { id: '1', name: 'Faire la vaisselle',  pts: 10, state: 'done'    },
  { id: '2', name: 'Ranger sa chambre',   pts: 30, state: 'pending' },
  { id: '3', name: 'Faire ses devoirs',   pts: 50, state: 'todo'    },
];

export default function ChildHomeScreen() {
  const { fromParent } = useLocalSearchParams<{ fromParent?: string }>();
  const [tasks, setTasks]   = useState<Task[]>(INITIAL_TASKS);
  const [points, setPoints] = useState(120);
  const [streak]            = useState(5);
  const ptsAnim             = useRef(new Animated.Value(1)).current;

  const nextRewardName = 'Soirée TV';
  const nextRewardCost = 100;
  const progress       = Math.min(1, points / nextRewardCost);
  const doneCount      = tasks.filter(t => t.state === 'done').length;

  function bumpPts() {
    Animated.sequence([
      Animated.spring(ptsAnim, { toValue: 1.08, useNativeDriver: true, speed: 40 }),
      Animated.spring(ptsAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
  }

  function markDone(id: string) {
    setTasks(ts => ts.map(t => t.id === id && t.state === 'todo' ? { ...t, state: 'pending' } : t));
    // Simulate parent approval after 3s
    setTimeout(() => {
      setTasks(ts => {
        const task = ts.find(t => t.id === id);
        if (task) setPoints(p => { bumpPts(); return p + task.pts; });
        return ts.map(t => t.id === id && t.state === 'pending' ? { ...t, state: 'done' } : t);
      });
    }, 3000);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}><Text style={styles.avatarEmoji}>🦊</Text></View>
            <View>
              <Text style={styles.greetingSub}>Bonjour,</Text>
              <Text style={styles.greetingName}>Lucas 👋</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {fromParent === 'true' && (
              <TouchableOpacity
                style={styles.parentBtn}
                onPress={() => router.replace('/(parent)/dashboard')}
                activeOpacity={0.8}
              >
                <Text style={styles.parentBtnText}>👨‍👩‍👧</Text>
              </TouchableOpacity>
            )}
            <View style={styles.notifBtn}><Text style={{ fontSize: 18 }}>🔔</Text></View>
          </View>
        </View>

        {/* Points hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} pointerEvents="none" />
          <Text style={styles.ptsLabel}>⭐ Ton score</Text>
          <View style={styles.ptsRow}>
            <Animated.Text style={[styles.ptsValue, { transform: [{ scale: ptsAnim }] }]}>
              {points}
            </Animated.Text>
            <Text style={styles.ptsSuffix}>pts</Text>
          </View>
          {/* Progress to next reward */}
          <View style={styles.progressWrap}>
            <Text style={{ fontSize: 18 }}>📺</Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressName}>{nextRewardName}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.streak}>
          <Text style={{ fontSize: 28, filter: 'drop-shadow(0 0 8px orange)' }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakNum}>{streak} jours</Text>
            <Text style={styles.streakSub}>consécutifs — continue ! 💪</Text>
          </View>
          <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>Série</Text></View>
        </View>

        {/* Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MISSIONS DU JOUR</Text>
          <Text style={styles.sectionCount}>{doneCount}/{tasks.length}</Text>
        </View>

        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, task.state === 'done' && styles.taskDone, task.state === 'pending' && styles.taskPending]}
            onPress={() => task.state === 'todo' && markDone(task.id)}
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
              {task.state === 'pending' && <Text style={styles.taskSub}>Papa vérifie bientôt ! 🤞</Text>}
            </View>
            <View style={[styles.ptsBadge, task.state === 'done' && styles.ptsBadgeDone]}>
              <Text style={[styles.ptsBadgeText, task.state === 'done' && styles.ptsBadgeTextDone]}>+{task.pts} pts</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgScreen },
  scroll: { paddingBottom: 20 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingTop: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  parentBtn:   { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  parentBtnText: { fontSize: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 8 },
  avatarEmoji: { fontSize: 24 },
  greetingSub:  { fontSize: 13, fontWeight: '600', color: Colors.textDim },
  greetingName: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  hero: {
    marginHorizontal: Spacing.screen,
    backgroundColor: Colors.bgHero,
    borderRadius: Radii.hero,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,184,0,0.06)',
  },
  ptsLabel: { fontSize: 11, fontWeight: '700', color: Colors.textDim, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  ptsRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 2 },
  ptsValue: { fontSize: 68, fontWeight: '900', color: Colors.gold, lineHeight: 62, letterSpacing: -3 },
  ptsSuffix:{ fontSize: 20, fontWeight: '700', color: Colors.goldDim, marginBottom: 6 },

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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: 18, marginBottom: 10 },
  sectionTitle:  { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionCount:  { fontSize: 12, fontWeight: '700', color: Colors.textFaint },

  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: Spacing.screen, marginBottom: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  taskDone:    { backgroundColor: Colors.bgCardDone,    borderColor: 'rgba(76,175,80,0.2)' },
  taskPending: { backgroundColor: Colors.bgCardPending, borderColor: 'rgba(255,184,0,0.2)' },

  checkbox: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  checkDone:    { backgroundColor: Colors.green, borderColor: Colors.green },
  checkPending: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.35)' },

  taskName:     { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  taskNameDone: { color: 'rgba(255,255,255,0.22)', textDecorationLine: 'line-through', fontWeight: '700' },
  taskSub:      { fontSize: 11, fontWeight: '700', color: 'rgba(255,184,0,0.7)', marginTop: 2 },

  ptsBadge:     { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.18)', borderRadius: Radii.pill, paddingHorizontal: 11, paddingVertical: 5 },
  ptsBadgeDone: { backgroundColor: 'rgba(76,175,80,0.08)', borderColor: 'rgba(76,175,80,0.18)' },
  ptsBadgeText:     { fontSize: 13, fontWeight: '900', color: Colors.gold },
  ptsBadgeTextDone: { color: Colors.greenDim },
});
