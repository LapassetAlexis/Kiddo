import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { tasksApi, Task } from '@/lib/api/tasks';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';

type TaskStatus = 'validated' | 'rejected' | 'pending';

interface HistoryTask {
  id: string;
  childId: string;
  taskName: string;
  childName: string;
  childEmoji: string;
  pts: number;
  status: TaskStatus;
  time: string;
  approvedByName?: string;
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

function apiStatusToLocal(apiStatus: string): TaskStatus {
  if (apiStatus === 'validated') return 'validated';
  if (apiStatus === 'rejected') return 'rejected';
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
      pts: task.points,
      status: apiStatusToLocal(task.status),
      time: formatTime(dateRef),
      approvedByName: task.approvedByName,
    };
    (groups[key] = groups[key] ?? []).push(entry);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

const STATUS_CONFIG = {
  validated: { label: 'Validée',    color: Colors.green,  bg: 'rgba(76,175,80,0.12)',   border: 'rgba(76,175,80,0.22)',   icon: '✓' },
  rejected:  { label: 'Rejetée',   color: '#EF5350',     bg: 'rgba(239,83,80,0.1)',    border: 'rgba(239,83,80,0.2)',    icon: '✕' },
  pending:   { label: 'En attente', color: Colors.gold,   bg: 'rgba(255,184,0,0.1)',    border: 'rgba(255,184,0,0.2)',    icon: '⏳' },
};

type Filter = 'all' | 'validated' | 'rejected' | 'pending';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'Toutes'     },
  { value: 'pending',   label: 'En attente' },
  { value: 'validated', label: 'Validées'   },
  { value: 'rejected',  label: 'Rejetées'   },
];

export default function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [childFilter, setChildFilter] = useState<string>('all');

  const { data: historyData, loading, error, refresh } = useApiData(
    () => tasksApi.history(),
    [],
  );

  useFocusEffect(useCallback(() => { refresh(); }, []));

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
  const totalPts       = allTasks.filter(t => t.status === 'validated').reduce((sum, t) => sum + t.points, 0);
  const totalPending   = allTasks.filter(t => t.status === 'pending_approval' || t.status === 'created').length;

  if (loading && !historyData) return <LoadingScreen />;
  if (error && !historyData) return <ErrorScreen message={error} onRetry={refresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches 📋</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(parent)/create-task')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.green }]}>{totalValidated}</Text>
          <Text style={styles.statLabel}>Validées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{totalPending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>+{totalPts}</Text>
          <Text style={styles.statLabel}>Pts accordés</Text>
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
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Aucune tâche pour ce filtre</Text>
        </View>
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
                  <Text style={[styles.rowPts, item.status !== 'validated' && { color: Colors.textFaint }]}>
                    {item.status === 'validated' ? `+${item.pts}` : `${item.pts}`} pts
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:      { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  addBtn:     { width: 44, height: 44, backgroundColor: Colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, fontWeight: '900', color: '#1a1000', lineHeight: 28 },

  statsRow: { flexDirection: 'row', gap: 10, padding: Spacing.screen, paddingBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },

  childFilters: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.screen, paddingTop: 14,
  },
  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  childChipActive:    { borderColor: 'rgba(255,184,0,0.35)', backgroundColor: 'rgba(255,184,0,0.08)' },
  childChipEmoji:     { fontSize: 14 },
  childChipText:      { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  childChipTextActive:{ color: Colors.gold },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.screen, paddingTop: 10, paddingBottom: 6,
  },
  filterChip: {
    borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' },
  filterText:       { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  filterTextActive: { color: Colors.gold },

  list: { padding: Spacing.screen, gap: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 12, marginBottom: 6,
  },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, padding: 13 },
  rowFirst: { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:  { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },

  childAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,184,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowInfo:   { flex: 1, gap: 2 },
  rowTask:   { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  rowMeta:   { fontSize: 11, fontWeight: '600', color: Colors.textFaint },

  rowRight:  { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  rowPts:    { fontSize: 13, fontWeight: '900', color: Colors.gold },
  statusBadge: {
    borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '900' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 44 },
  emptyText:  { fontSize: 15, fontWeight: '800', color: Colors.textDim },
});
