import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { rewardsApi } from '@/lib/api/rewards';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';

type Availability = 'unlimited' | 'once';
type HistoryStatus = 'granted' | 'refused';

interface HistoryEntry {
  id: string; emoji: string; rewardName: string;
  childId: string; childName: string; childEmoji: string;
  pts: number; status: HistoryStatus; time: string;
}

interface HistorySection {
  title: string;
  data: HistoryEntry[];
}

function formatTime(dateStr?: string): string {

  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function groupHistoryByDate(items: any[]): HistorySection[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups: Record<string, HistoryEntry[]> = {};

  for (const item of items) {
    const d = new Date(item.createdAt); d.setHours(0, 0, 0, 0);
    const key =
      d >= today     ? "Aujourd'hui" :
      d >= yesterday ? 'Hier' :
      `il y a ${Math.floor((today.getTime() - d.getTime()) / 86400000)} jours`;
    const entry: HistoryEntry = {
      id:        item.id,
      emoji:     item.emoji ?? '🎁',
      rewardName:item.title ?? item.rewardName ?? '—',
      childId:   item.child?.id ?? item.childId ?? '',
      childName: item.childName ?? item.child?.name ?? '—',
      childEmoji:item.childEmoji ?? item.child?.avatar ?? '👶',
      pts:       item.pts ?? item.cost ?? 0,
      status:    (item.status === 'refused' ? 'refused' : 'granted') as HistoryStatus,
      time:      formatTime(item.createdAt),
    };
    (groups[key] = groups[key] ?? []).push(entry);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

const STATUS_CONFIG = {
  granted: { label: 'Accordée', color: Colors.green,  bg: 'rgba(76,175,80,0.12)', border: 'rgba(76,175,80,0.22)', icon: '✓' },
  refused: { label: 'Refusée',  color: '#EF5350',     bg: 'rgba(239,83,80,0.1)',  border: 'rgba(239,83,80,0.2)', icon: '✕' },
};

type Tab = 'catalogue' | 'historique';

export default function ManageScreen() {
  const [tab, setTab]           = useState<Tab>('catalogue');
  const [childFilter, setChildFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | HistoryStatus>('all');

  const {
    data: catalogueData,
    loading: catalogueLoading,
    error: catalogueError,
    refresh: catalogueRefresh,
  } = useApiData(() => rewardsApi.list(), []);

  const {
    data: historyRaw,
    loading: historyLoading,
    error: historyError,
    refresh: historyRefresh,
  } = useApiData(() => rewardsApi.history(), []);

  useFocusEffect(useCallback(() => { catalogueRefresh(); historyRefresh(); }, []));

  const rewards = (catalogueData ?? []).filter(r => r.status === 'available');
  const historySections: HistorySection[] = groupHistoryByDate(historyRaw ?? []);

  // Build child list from history
  const uniqueChildren = Array.from(
    new Map(
      (historyRaw ?? [])
        .filter(h => h.child?.id)
        .map((h: any) => [h.child.id, { id: h.child.id, name: h.child.name, emoji: h.child.avatar ?? '👶' }])
    ).values()
  );
  const children = [
    { id: 'all', name: 'Tous', emoji: '👨‍👩‍👧' },
    ...uniqueChildren,
  ];

  const filteredHistory = historySections.map(s => ({
    ...s,
    data: s.data.filter(h => {
      const childOk  = childFilter === 'all' || h.childId === childFilter;
      const statusOk = statusFilter === 'all' || h.status === statusFilter;
      return childOk && statusOk;
    }),
  })).filter(s => s.data.length > 0);

  const allHistory   = historySections.flatMap(s => s.data);
  const totalGranted = allHistory.filter(h => h.status === 'granted').length;
  const totalPts     = allHistory.filter(h => h.status === 'granted').reduce((s, h) => s + h.pts, 0);

  if (tab === 'catalogue' && catalogueLoading && !catalogueData) return <LoadingScreen />;
  if (tab === 'catalogue' && catalogueError && !catalogueData) return <ErrorScreen message={catalogueError} onRetry={catalogueRefresh} />;
  if (tab === 'historique' && historyLoading && !historyRaw) return <LoadingScreen />;
  if (tab === 'historique' && historyError && !historyRaw) return <ErrorScreen message={historyError} onRetry={historyRefresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Récompenses 🎁</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(parent)/create-reward')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        {(['catalogue', 'historique'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'catalogue' ? '🎁 Catalogue' : '📜 Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Catalogue ── */}
      {tab === 'catalogue' && (
        rewards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyTitle}>Aucune récompense</Text>
            <Text style={styles.emptySub}>Crée des récompenses que tes enfants{'\n'}pourront réclamer avec leurs points.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(parent)/create-reward')} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>Créer une récompense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {rewards.map(r => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.cardEmoji}>{r.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.availBadge}>
                      <Text style={styles.availBadgeText}>
                        {r.availability === 'once' ? '1️⃣ Une fois' : '♾️ Illimitée'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.costWrap}>
                  <Text style={styles.costValue}>{r.cost}</Text>
                  <Text style={styles.costPts}>pts</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addCard} onPress={() => router.push('/(parent)/create-reward')} activeOpacity={0.7}>
              <Text style={styles.addCardText}>＋  Ajouter une récompense</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        )
      )}

      {/* ── Historique ── */}
      {tab === 'historique' && (
        <View style={{ flex: 1 }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.green }]}>{totalGranted}</Text>
              <Text style={styles.statLabel}>Accordées</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.gold }]}>{totalPts}</Text>
              <Text style={styles.statLabel}>Pts dépensés</Text>
            </View>
          </View>

          {/* Filtres */}
          <View style={styles.filterRow}>
            {children.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.filterChip, childFilter === c.id && styles.filterChipActive]}
                onPress={() => setChildFilter(c.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterEmoji}>{c.emoji}</Text>
                <Text style={[styles.filterText, childFilter === c.id && styles.filterTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            {(['all', 'granted', 'refused'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, statusFilter === s && styles.statusChipActive]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusChipText, statusFilter === s && styles.statusChipTextActive]}>
                  {s === 'all' ? 'Toutes' : s === 'granted' ? '✓' : '✕'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Liste */}
          {filteredHistory.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
            </View>
          ) : (
            <SectionList
              sections={filteredHistory}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              renderItem={({ item, index, section }) => {
                const cfg     = STATUS_CONFIG[item.status];
                const isFirst = index === 0;
                const isLast  = index === section.data.length - 1;
                return (
                  <View style={[
                    styles.historyRow,
                    isFirst && styles.rowFirst,
                    isLast  && styles.rowLast,
                    !isFirst && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
                  ]}>
                    <Text style={styles.historyEmoji}>{item.emoji}</Text>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyName}>{item.rewardName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.childEmoji} {item.childName} · {item.time}
                        {item.grantedByName ? ` · par ${item.grantedByName}` : ''}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyPts, item.status === 'refused' && { color: Colors.textFaint }]}>
                        {item.status === 'granted' ? '−' : '↩'}{item.pts} pts
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
        </View>
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

  list: { padding: Spacing.screen, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  cardEmoji: { fontSize: 30 },
  cardInfo:  { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  badgeRow:  { flexDirection: 'row' },
  availBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  availBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textFaint },
  costWrap:   { alignItems: 'center' },
  costValue:  { fontSize: 22, fontWeight: '900', color: Colors.gold, lineHeight: 24 },
  costPts:    { fontSize: 10, fontWeight: '700', color: Colors.textFaint },

  addCard: {
    borderRadius: Radii.card, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', padding: 18, alignItems: 'center',
  },
  addCardText: { fontSize: 14, fontWeight: '800', color: Colors.textDim },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  emptySub:   { fontSize: 14, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '900', color: '#1a1000' },

  // Onglets
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.gold },
  tabText:       { fontSize: 14, fontWeight: '800', color: Colors.textDim },
  tabTextActive: { color: Colors.gold },

  // Stats historique
  statsRow: { flexDirection: 'row', gap: 10, padding: Spacing.screen, paddingBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Filtres
  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.screen, paddingVertical: 10,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  filterChipActive:    { borderColor: 'rgba(255,184,0,0.35)', backgroundColor: 'rgba(255,184,0,0.08)' },
  filterEmoji:         { fontSize: 13 },
  filterText:          { fontSize: 12, fontWeight: '700', color: Colors.textDim },
  filterTextActive:    { color: Colors.gold },

  statusChip: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  statusChipActive:    { borderColor: 'rgba(255,184,0,0.35)', backgroundColor: 'rgba(255,184,0,0.08)' },
  statusChipText:      { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  statusChipTextActive:{ color: Colors.gold },

  // Historique rows
  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 12, marginBottom: 4,
  },
  historyRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, padding: 13 },
  rowFirst:    { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:     { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },
  historyEmoji:{ fontSize: 26, width: 34, textAlign: 'center' },
  historyInfo: { flex: 1, gap: 2 },
  historyName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  historyMeta: { fontSize: 11, fontWeight: '600', color: Colors.textFaint },
  historyRight:{ alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  historyPts:  { fontSize: 13, fontWeight: '900', color: Colors.orange },
  statusBadge: { borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:  { fontSize: 10, fontWeight: '900' },
});
