import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
  xpAmount?: number;
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
  // Fusionner gold+XP du même referenceId en une seule ligne
  const merged = new Map<string, Transaction & { xpTx?: Transaction }>();
  const ordered: (Transaction & { xpTx?: Transaction })[] = [];

  for (const tx of txList) {
    if (tx.referenceId && tx.type === 'earn') {
      const key = tx.referenceId;
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        if (tx.currency === 'xp') existing.xpTx = tx;
        else if (existing.currency === 'xp') {
          // existing was XP, current is gold → swap to make gold the base
          const newBase = { ...tx, xpTx: existing };
          merged.set(key, newBase);
          const idx = ordered.indexOf(existing);
          if (idx >= 0) ordered[idx] = newBase;
        }
        continue;
      }
      merged.set(key, { ...tx });
      ordered.push(merged.get(key)!);
    } else {
      ordered.push(tx as any);
    }
  }

  const sectionMap = new Map<string, UITransaction[]>();
  for (const tx of ordered) {
    const title = getSectionTitle(tx.createdAt);
    const isXp  = tx.currency === 'xp' && !(tx as any).xpTx;
    const label = tx.note ?? (isXp ? 'XP gagné' : tx.type === 'earn' ? 'Pièces gagnées' : 'Récompense');
    const uiTx: UITransaction = {
      id:        tx.id,
      name:      label,
      type:      tx.type,
      amount:    isXp ? 0 : tx.amount,
      xpAmount:  (tx as any).xpTx?.amount ?? (isXp ? tx.amount : undefined),
      meta:      formatMeta(tx),
      icon:      isXp ? '⭐' : tx.type === 'earn' ? '✅' : '🎁',
    };
    if (!sectionMap.has(title)) sectionMap.set(title, []);
    sectionMap.get(title)!.push(uiTx);
  }

  return Array.from(sectionMap.entries()).map(([title, data]) => ({ title, data }));
}

type Filter = 'all' | 'earn' | 'spend';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const { data: rewardsData } = useApiData(() => rewardsApi.list(), []);

  if (txLoading || balanceLoading || streakLoading) return <LoadingScreen />;
  if (txError)      return <ErrorScreen message={txError}      onRetry={refreshTx} />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (streakError)  return <ErrorScreen message={streakError}  onRetry={refreshStreak} />;

  const allTx: Transaction[] = txResponse?.data ?? [];

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
            <Text style={styles.title}>Mes pièces 🪙</Text>

            {/* Balance hero */}
            <View style={styles.hero}>
              <View style={styles.heroGlow} pointerEvents="none" />
              <Text style={styles.heroLabel}>🪙 Ton solde</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroValue}>{BALANCE}</Text>
                <Text style={styles.heroUnit}>🪙</Text>
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
                <Text style={[styles.statValue, { color: colors.green }]}>+{earnedW}</Text>
                <Text style={styles.statLabel}>Gagnés</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.orange }]}>{spentW > 0 ? `−${spentW}` : '0'}</Text>
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
                { value: 'all'   as Filter, label: 'Tout'       },
                { value: 'earn'  as Filter, label: '✅ Gagné'    },
                { value: 'spend' as Filter, label: '🎁 Dépensé'  },
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
              !isFirst && { borderTopWidth: 1, borderTopColor: colors.border },
            ]}>
              <View style={[styles.rowIcon, item.type === 'earn' ? styles.iconEarn : styles.iconSpend]}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.meta}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                {item.amount > 0 && (
                  <Text style={[styles.rowAmount, { color: item.type === 'earn' ? colors.green : colors.orange }]}>
                    {item.type === 'earn' ? '+' : '−'}{item.amount} 🪙
                  </Text>
                )}
                {item.xpAmount ? (
                  <Text style={[styles.rowAmount, { color: '#a78bfa', fontSize: 12 }]}>+{item.xpAmount} ⭐</Text>
                ) : item.icon === '⭐' && item.amount > 0 ? (
                  <Text style={[styles.rowAmount, { color: '#a78bfa' }]}>+{item.amount} ⭐</Text>
                ) : null}
              </View>
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bgScreen },
  listContent: { padding: Spacing.screen, gap: 4, paddingTop: 0 },

  title: {
    fontSize: 22, fontWeight: '900', color: colors.textPrimary,
    paddingTop: 12, marginBottom: 14,
  },

  // Hero balance
  hero: {
    backgroundColor: colors.bgCard,
    borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: colors.borderGold,
    overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,184,0,0.06)',
  },
  heroLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textDim,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4,
  },
  heroRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 14 },
  heroValue:{ fontSize: 64, fontWeight: '900', color: colors.gold, lineHeight: 58, letterSpacing: -3 },
  heroUnit: { fontSize: 20, fontWeight: '700', color: colors.goldDim, marginBottom: 8 },

  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgScreen,
    borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  progressInfo:  { flex: 1 },
  progressName:  { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: colors.border, marginTop: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 99, backgroundColor: colors.gold },
  progressPct:   { fontSize: 14, fontWeight: '900', color: colors.gold },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statStreak: { borderColor: 'rgba(255,107,53,0.2)', backgroundColor: 'rgba(255,107,53,0.06)' },
  statValue:  { fontSize: 18, fontWeight: '900', color: colors.textPrimary, lineHeight: 20 },
  statLabel:  { fontSize: 10, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Filtres
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterChip: {
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' },
  filterText:       { fontSize: 12, fontWeight: '800', color: colors.textDim },
  filterTextActive: { color: colors.gold },

  // Section
  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 4,
  },

  // Rows
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, padding: 13 },
  rowFirst: { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:  { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },
  rowIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEarn: { backgroundColor: 'rgba(76,175,80,0.12)' },
  iconSpend:{ backgroundColor: 'rgba(255,107,53,0.10)' },
  rowName:  { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  rowMeta:  { fontSize: 11, fontWeight: '600', color: colors.textFaint, marginTop: 2 },
  rowAmount:{ fontSize: 14, fontWeight: '900' },

  empty:      { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 15, fontWeight: '800', color: colors.textDim },
});
