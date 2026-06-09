import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { tasksApi, Task } from '@/lib/api/tasks';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';

type TaskStatus = 'validated' | 'rejected' | 'pending' | 'partial';

interface HistoryTask {
  id: string;
  childId: string;
  taskName: string;
  childName: string;
  childEmoji: string;
  goldReward: number;
  status: TaskStatus;
  time: string;
  approvedByName?: string;
  timesPerDay: number;
  completedToday: number;
}

interface Section {
  title: string;
  data: HistoryTask[];
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function apiStatusToLocal(task: Task): TaskStatus {
  if (task.status === 'validated') return 'validated';
  if (task.status === 'rejected') return 'rejected';
  if (task.timesPerDay > 1 && task.completedToday > 0) return 'partial';
  return 'pending';
}

function groupTasksByDate(tasks: Task[]): Section[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups: Record<string, HistoryTask[]> = {};

  for (const task of tasks) {
    const dateRef = task.validatedAt ?? task.submittedAt ?? task.createdAt;
    const d = new Date(dateRef); d.setHours(0, 0, 0, 0);
    const key =
      d >= today     ? "Aujourd'hui" :
      d >= yesterday ? 'Hier' :
      `il y a ${Math.floor((today.getTime() - d.getTime()) / 86400000)} jours`;
    const entry: HistoryTask = {
      id: task.id,
      childId: task.child.id,
      taskName: task.title,
      childName: task.child.name,
      childEmoji: task.child.avatar,
      goldReward: task.goldReward,
      status: apiStatusToLocal(task),
      time: formatTime(dateRef),
      approvedByName: task.approvedByName,
      timesPerDay: task.timesPerDay ?? 1,
      completedToday: task.completedToday ?? 0,
    };
    (groups[key] = groups[key] ?? []).push(entry);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

type Filter = 'all' | 'validated' | 'rejected' | 'pending';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'Toutes'     },
  { value: 'pending',   label: 'En attente' },
  { value: 'validated', label: 'Validées'   },
  { value: 'rejected',  label: 'Rejetées'   },
];

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:      { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  addBtn:     { width: 44, height: 44, backgroundColor: colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, fontWeight: '900', color: '#1a1000', lineHeight: 28 },

  statsRow: { flexDirection: 'row', gap: 10, padding: Spacing.screen, paddingBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },

  childFilters: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.screen, paddingTop: 14,
  },
  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  childChipActive:    { borderColor: 'rgba(255,184,0,0.35)', backgroundColor: 'rgba(255,184,0,0.08)' },
  childChipEmoji:     { fontSize: 14 },
  childChipText:      { fontSize: 13, fontWeight: '700', color: colors.textDim },
  childChipTextActive:{ color: colors.gold },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.screen, paddingTop: 10, paddingBottom: 6,
  },
  filterChip: {
    borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' },
  filterText:       { fontSize: 12, fontWeight: '800', color: colors.textDim },
  filterTextActive: { color: colors.gold },

  list: { padding: Spacing.screen, gap: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 12, marginBottom: 6,
  },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, padding: 13 },
  rowFirst: { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:  { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },

  childAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,184,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowInfo:   { flex: 1, gap: 2 },
  rowTask:   { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  rowMeta:   { fontSize: 11, fontWeight: '600', color: colors.textFaint },

  rowRight:  { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  rowPts:    { fontSize: 13, fontWeight: '900', color: colors.gold },
  stepBadge: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)' },
  statusBadge: {
    borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '900' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  emptySub:   { fontSize: 13, fontWeight: '600', color: colors.textDim, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn:   { backgroundColor: colors.gold, borderRadius: Radii.md, paddingHorizontal: 22, paddingVertical: 12, marginTop: 4 },
  emptyBtnText:{ fontSize: 14, fontWeight: '900', color: '#1a1000' },
});

export default function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [childFilter, setChildFilter] = useState<string>('all');
  const addBtnRef  = useRef<any>(null);
  const statsRef   = useRef<any>(null);
  const { active: tourActive, finish: finishTour } = useTour('tasks');
  const [tourVisible, setTourVisible] = useState(false);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const STATUS_CONFIG = useMemo(() => ({
    validated: { label: 'Validée',    color: colors.green,    bg: 'rgba(76,175,80,0.12)',   border: 'rgba(76,175,80,0.22)',   icon: '✓'  },
    rejected:  { label: 'Rejetée',   color: '#EF5350',       bg: 'rgba(239,83,80,0.1)',    border: 'rgba(239,83,80,0.2)',    icon: '✕'  },
    pending:   { label: 'En attente', color: colors.gold,     bg: 'rgba(255,184,0,0.1)',    border: 'rgba(255,184,0,0.2)',    icon: '⏳' },
    partial:   { label: 'En cours',   color: colors.orange,   bg: 'rgba(255,107,53,0.1)',   border: 'rgba(255,107,53,0.2)',   icon: '↺'  },
  }), [colors]);

  const { data: historyData, loading, error, refresh } = useApiData(
    () => tasksApi.history(),
    [],
  );

  useFocusEffect(useCallback(() => { refresh(); }, []));

  useEffect(() => {
    if (tourActive && !loading && (historyData ?? []).length > 0) {
      const t = setTimeout(() => setTourVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, [tourActive, loading, (historyData ?? []).length]);

  const allTasks = historyData ?? [];
  const allSections = groupTasksByDate(allTasks);

  // Build child filter list from loaded data
  const uniqueChildren = Array.from(
    new Map(allTasks.map(t => [t.child.id, { id: t.child.id, name: t.child.name, emoji: t.child.avatar }])).values()
  );
  const children = [
    { id: 'all', name: 'Tous', emoji: '👨‍👩‍👧' },
    ...uniqueChildren,
  ];

  const filteredSections: Section[] = allSections.map(section => ({
    ...section,
    data: section.data.filter(t => {
      const statusOk = filter === 'all' || t.status === filter;
      const childOk  = childFilter === 'all' || t.childId === childFilter;
      return statusOk && childOk;
    }),
  })).filter(s => s.data.length > 0);

  // Stats
  const totalValidated = allTasks.filter(t => t.status === 'validated').length;
  const totalGold      = allTasks.filter(t => t.status === 'validated').reduce((sum, t) => sum + t.goldReward, 0);
  const totalPending   = allTasks.filter(t => t.status === 'pending_approval' || t.status === 'created').length;

  if (loading && !historyData) return <LoadingScreen />;
  if (error && !historyData) return <ErrorScreen message={error} onRetry={refresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quêtes ⚔️</Text>
        <View ref={addBtnRef} collapsable={false}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(parent)/create-task')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View ref={statsRef} style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.green }]}>{totalValidated}</Text>
          <Text style={styles.statLabel}>Validées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.gold }]}>{totalPending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.gold }]}>+{totalGold}🪙</Text>
          <Text style={styles.statLabel}>Or accordé</Text>
        </View>
      </View>

      {/* Filtre enfant */}
      <View style={styles.childFilters}>
        {children.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.childChip, childFilter === c.id && styles.childChipActive]}
            onPress={() => setChildFilter(c.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.childChipEmoji}>{c.emoji}</Text>
            <Text style={[styles.childChipText, childFilter === c.id && styles.childChipTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtre statut */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {filteredSections.length === 0 ? (
        allTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚔️</Text>
            <Text style={styles.emptyTitle}>Pas encore de quêtes</Text>
            <Text style={styles.emptySub}>Crée des quêtes pour tes enfants depuis le dashboard et suis leur progression ici.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(parent)/create-task')} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Créer une quête</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySub}>Aucune quête ne correspond à ce filtre.</Text>
          </View>
        )
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const cfg    = STATUS_CONFIG[item.status];
            const isFirst = index === 0;
            const isLast  = index === section.data.length - 1;
            return (
              <View style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast  && styles.rowLast,
                !isFirst && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
              ]}>
                {/* Avatar enfant */}
                <View style={styles.childAvatar}>
                  <Text style={{ fontSize: 18 }}>{item.childEmoji}</Text>
                </View>

                {/* Infos */}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTask}>{item.taskName}</Text>
                  <Text style={styles.rowMeta}>
                    {item.childName} · {item.time}
                    {item.approvedByName ? ` · par ${item.approvedByName}` : ''}
                  </Text>
                </View>

                {/* Points */}
                <View style={styles.rowRight}>
                  {item.timesPerDay > 1 && (
                    <Text style={styles.stepBadge}>{item.completedToday}/{item.timesPerDay}</Text>
                  )}
                  <Text style={[styles.rowPts, item.status !== 'validated' && { color: colors.textFaint }]}>
                    {item.status === 'validated' ? `+${item.goldReward}` : `${item.goldReward}`} 🪙
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <SpotlightTour
        visible={tourVisible}
        onFinish={() => { setTourVisible(false); finishTour(); }}
        steps={[
          { ref: addBtnRef, title: 'Créer une quête',  body: 'Ajoute une quête quotidienne, hebdomadaire ou unique pour tes enfants.' },
          { ref: statsRef,  title: 'Statistiques ⚔️',  body: 'Nombre de quêtes validées, en attente et or total distribué à ta famille.' },
        ] satisfies TourStep[]}
      />
    </SafeAreaView>
  );
}
