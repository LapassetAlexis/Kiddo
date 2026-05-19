import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { transactionsApi, Transaction } from '@/lib/api/transactions';
import { rewardsApi } from '@/lib/api/rewards';

type TxType = 'earn' | 'spend';

interface UITransaction {
  id: string;
  name: string;
  type: TxType;
  amount: number;
  meta: string;
  icon: string;
}

interface UISection {
  title: string;
  data: UITransaction[];
}

function formatMeta(tx: Transaction): string {
  const d = new Date(tx.createdAt);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return tx.note ? `${tx.note} · ${h}h${m}` : `${h}h${m}`;
}

function getSectionTitle(createdAt: string): string {
  const now  = new Date();
  const date = new Date(createdAt);
  const diffMs   = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays === 2) return 'Il y a 2 jours';
  if (diffDays === 3) return 'Il y a 3 jours';
  return `Il y a ${diffDays} jours`;
}

function groupTransactions(txList: Transaction[]): UISection[] {
  const map = new Map<string, UITransaction[]>();

  for (const tx of txList) {
    const title = getSectionTitle(tx.createdAt);
    const uiTx: UITransaction = {
      id:     tx.id,
      name:   tx.note ?? (tx.type === 'earn' ? 'Points gagnés' : 'Récompense'),
      type:   tx.type,
      amount: tx.amount,
      meta:   formatMeta(tx),
      icon:   tx.type === 'earn' ? '✅' : '🎁',
    };
    if (!map.has(title)) map.set(title, []);
    map.get(title)!.push(uiTx);
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

type Filter = 'all' | 'earn' | 'spend';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');

  const {
    data: txResponse,
    loading: txLoading,
    error: txError,
    refresh: refreshTx,
  } = useApiData(() => transactionsApi.list(user?.id ?? ''), [user?.id]);

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

  if (txLoading || balanceLoading || streakLoading) return <LoadingScreen />;
  if (txError)      return <ErrorScreen message={txError}      onRetry={refreshTx} />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (streakError)  return <ErrorScreen message={streakError}  onRetry={refreshStreak} />;

  const allTx: Transaction[] = txResponse?.data ?? [];

  const { data: rewardsData } = useApiData(() => rewardsApi.list(), []);

  const BALANCE = balanceData?.balance ?? 0;
  const STREAK  = streakData?.currentStreak ?? 0;

  const nextReward = (rewardsData ?? [])
    .filter(r => r.status === 'available' && r.cost > BALANCE)
    .sort((a, b) => a.cost - b.cost)[0]
    ?? (rewardsData ?? []).sort((a, b) => a.cost - b.cost)[0];
  const NEXT_REWARD = nextReward?.title ?? '—';
  const NEXT_COST   = nextReward?.cost ?? 100;

  const earnedW  = balanceData?.earnedThisWeek  ?? 0;
  const spentW   = balanceData?.spentThisWeek   ?? 0;
  const progress = NEXT_COST > 0 ? Math.min(1, BALANCE / NEXT_COST) : 1;

  const ALL_SECTIONS = groupTransactions(allTx);

  const filteredSections: UISection[] = ALL_SECTIONS.map(s => ({
    ...s,
    data: s.data.filter(t => filter === 'all' || t.type === filter),
  })).filter(s => s.data.length > 0);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SectionList
        sections={filteredSections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Text style={styles.title}>Mes points 📊</Text>

            {/* Balance hero */}
            <View style={styles.hero}>
              <View style={styles.heroGlow} pointerEvents="none" />
              <Text style={styles.heroLabel}>⭐ Ton solde</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroValue}>{BALANCE}</Text>
                <Text style={styles.heroUnit}>pts</Text>
              </View>
              {/* Progression */}
              <View style={styles.progressWrap}>
                <Text style={{ fontSize: 18 }}>📺</Text>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressName}>{NEXT_REWARD}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                </View>
                <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>

            {/* Stats + Streak */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: Colors.green }]}>+{earnedW}</Text>
                <Text style={styles.statLabel}>Gagnés</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: Colors.orange }]}>−{spentW}</Text>
                <Text style={styles.statLabel}>Dépensés</Text>
              </View>
              <View style={[styles.stat, styles.statStreak]}>
                <Text style={styles.statValue}>🔥 {STREAK}</Text>
                <Text style={styles.statLabel}>Jours série</Text>
              </View>
            </View>

            {/* Filtres */}
            <View style={styles.filterRow}>
              {([
                { value: 'all'   as Filter, label: 'Tout'      },
                { value: 'earn'  as Filter, label: '✅ Gagné'   },
                { value: 'spend' as Filter, label: '🎁 Dépensé' },
              ]).map(f => (
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
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast  = index === section.data.length - 1;
          return (
            <View style={[
              styles.row,
              isFirst && styles.rowFirst,
              isLast  && styles.rowLast,
              !isFirst && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
            ]}>
              <View style={[styles.rowIcon, item.type === 'earn' ? styles.iconEarn : styles.iconSpend]}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.meta}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: item.type === 'earn' ? Colors.green : Colors.orange }]}>
                {item.type === 'earn' ? '+' : '−'}{item.amount} pts
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bgScreen },
  listContent: { padding: Spacing.screen, gap: 4, paddingTop: 0 },

  title: {
    fontSize: 22, fontWeight: '900', color: Colors.textPrimary,
    paddingTop: 12, marginBottom: 14,
  },

  // Hero balance
  hero: {
    backgroundColor: '#25252d',
    borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
    overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,184,0,0.06)',
  },
  heroLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4,
  },
  heroRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 14 },
  heroValue:{ fontSize: 64, fontWeight: '900', color: Colors.gold, lineHeight: 58, letterSpacing: -3 },
  heroUnit: { fontSize: 20, fontWeight: '700', color: Colors.goldDim, marginBottom: 8 },

  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  progressInfo:  { flex: 1 },
  progressName:  { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.75)' },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 99, backgroundColor: Colors.gold },
  progressPct:   { fontSize: 14, fontWeight: '900', color: Colors.gold },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statStreak: { borderColor: 'rgba(255,107,53,0.2)', backgroundColor: 'rgba(255,107,53,0.06)' },
  statValue:  { fontSize: 18, fontWeight: '900', color: Colors.textPrimary, lineHeight: 20 },
  statLabel:  { fontSize: 10, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Filtres
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterChip: {
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' },
  filterText:       { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  filterTextActive: { color: Colors.gold },

  // Section
  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 4,
  },

  // Rows
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, padding: 13 },
  rowFirst: { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:  { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },
  rowIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEarn: { backgroundColor: 'rgba(76,175,80,0.12)' },
  iconSpend:{ backgroundColor: 'rgba(255,107,53,0.10)' },
  rowName:  { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  rowMeta:  { fontSize: 11, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },
  rowAmount:{ fontSize: 14, fontWeight: '900' },

  empty:      { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 15, fontWeight: '800', color: Colors.textDim },
});
