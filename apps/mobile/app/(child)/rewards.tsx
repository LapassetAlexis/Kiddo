import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { rewardsApi, Reward } from '@/lib/api/rewards';
import { transactionsApi } from '@/lib/api/transactions';

type UIRewardStatus = 'available' | 'locked' | 'pending';

function getUIStatus(reward: Reward, balance: number): UIRewardStatus {
  if (reward.status === 'claimed') return 'pending';
  if (reward.status === 'available' && reward.cost <= balance) return 'available';
  return 'locked';
}

type Filter = 'all' | 'available' | 'locked';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const scrollRef  = useRef<ScrollView>(null);
  const ptsPillRef = useRef<any>(null);
  const filterRef  = useRef<any>(null);
  const { active: tourActive, finish: finishTour } = useTour('child-rewards');
  const [tourVisible, setTourVisible] = useState(false);

  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
    refresh: refreshBalance,
  } = useApiData(() => transactionsApi.getBalance(user?.id ?? ''), [user?.id]);

  const {
    data: rewardsData,
    loading: rewardsLoading,
    error: rewardsError,
    refresh: refreshRewards,
  } = useApiData(() => rewardsApi.list(), []);

  useEffect(() => {
    if (tourActive && !balanceLoading && !rewardsLoading) {
      const t = setTimeout(() => {
        if (scrollRef.current && filterRef.current) {
          filterRef.current.measureLayout(
            scrollRef.current,
            (_x: number, y: number) => {
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
              setTimeout(() => setTourVisible(true), 450);
            },
            () => setTourVisible(true),
          );
        } else {
          setTourVisible(true);
        }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [tourActive, balanceLoading, rewardsLoading]);

  if (balanceLoading || rewardsLoading) return <LoadingScreen />;
  if (balanceError) return <ErrorScreen message={balanceError} onRetry={refreshBalance} />;
  if (rewardsError) return <ErrorScreen message={rewardsError} onRetry={refreshRewards} />;

  const myGold = balanceData?.balance ?? 0;
  // 'granted' once-rewards are done — no need to show them
  const rawRewards: Reward[] = (rewardsData ?? []).filter(r => r.status !== 'granted');

  const rewards = rawRewards.map(r => ({
    ...r,
    uiStatus: getUIStatus(r, myGold),
  }));

  const available = rewards.filter(r => r.uiStatus === 'available');
  const pending   = rewards.filter(r => r.uiStatus === 'pending');
  const locked    = rewards.filter(r => r.uiStatus === 'locked');

  const displayed = filter === 'all' ? rewards
    : filter === 'available' ? [...available, ...pending]
    : locked;

  function claim(r: typeof rewards[0]) {
    if (r.uiStatus !== 'available') return;
    showModal({
      icon: r.emoji,
      title: `Réclamer "${r.title}" ?`,
      message: `Cela coûte ${r.cost} 🪙.\nTon gardien va recevoir ta demande et devra l'approuver.`,
      buttons: [
        {
          label: 'Réclamer 🎉', style: 'default',
          onPress: async () => {
            try {
              await rewardsApi.redeem(r.id, user?.id);
              refreshRewards();
              refreshBalance();
              showModal({
                icon: '⏳',
                title: 'Demande envoyée !',
                message: `Ton gardien va valider ta récompense "${r.title}" très bientôt.`,
                buttons: [{ label: 'Super !', style: 'default' }],
              });
            } catch (e: any) {
              showModal({
                icon: '😕',
                title: 'Erreur',
                message: e?.message ?? 'Une erreur est survenue.',
                buttons: [{ label: 'OK', style: 'cancel' }],
              });
            }
          },
        },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Magasin 🛒</Text>
        <View ref={ptsPillRef} collapsable={false} style={styles.ptsPill}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={styles.ptsPillText}>{myGold} pièces</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Récompenses en attente */}
        {pending.length > 0 && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>
                {pending.length} récompense{pending.length > 1 ? 's' : ''} en attente
              </Text>
              <Text style={styles.pendingDesc}>Ton gardien doit valider</Text>
            </View>
          </View>
        )}

        {/* Filtres */}
        <View ref={filterRef} collapsable={false} style={styles.filterRow}>
          {([
            { value: 'all'       as Filter, label: 'Toutes',    count: rewards.length },
            { value: 'available' as Filter, label: '🔓 Dispo',  count: available.length + pending.length },
            { value: 'locked'    as Filter, label: '🔒 Bientôt',count: locked.length },
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
              <View style={[styles.filterBadge, filter === f.value && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === f.value && styles.filterBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grille */}
        <View style={styles.grid}>
          {displayed.map(r => {
            const progress  = Math.min(1, myGold / r.cost);
            const missing   = r.cost - myGold;
            const isAvail   = r.uiStatus === 'available';
            const isPending = r.uiStatus === 'pending';
            const isLocked  = r.uiStatus === 'locked';

            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.card,
                  isAvail   && styles.cardAvail,
                  isPending && styles.cardPending,
                ]}
                onPress={() => isAvail && claim(r)}
                activeOpacity={isAvail ? 0.8 : 1}
                disabled={!isAvail}
              >
                {/* Status badge */}
                {isPending && (
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>⏳ En attente</Text>
                  </View>
                )}
                {isLocked && (
                  <View style={styles.lockPill}>
                    <Text style={styles.lockPillText}>🔒</Text>
                  </View>
                )}

                {/* Emoji */}
                <Text style={[styles.cardEmoji, isLocked && { opacity: 0.45 }]}>{r.emoji}</Text>

                {/* Nom */}
                <Text style={[styles.cardName, isLocked && { color: Colors.textDim }]}>
                  {r.title}
                </Text>

                {/* Coût */}
                <View style={[styles.costBadge, isLocked && styles.costBadgeLocked, isPending && styles.costBadgePending]}>
                  <Text style={[styles.costText, isLocked && styles.costTextLocked, isPending && styles.costTextPending]}>
                    {r.cost} 🪙
                  </Text>
                </View>

                {/* Barre de progression (locked seulement) */}
                {isLocked && (
                  <>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                    <Text style={styles.missingText}>encore {missing} 🪙</Text>
                  </>
                )}

                {/* Bouton réclamer */}
                {isAvail && (
                  <View style={styles.claimBtn}>
                    <Text style={styles.claimBtnText}>Réclamer</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />
      <SpotlightTour
        visible={tourVisible}
        onFinish={() => { setTourVisible(false); finishTour(); }}
        steps={[
          { ref: ptsPillRef, title: 'Ton trésor 🪙',       body: 'Voilà combien de pièces tu as gagnées !' },
          { ref: filterRef,  title: 'Les récompenses 🎁',  body: 'Appuie sur une récompense disponible pour la réclamer à ton gardien !' },
        ] satisfies TourStep[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgScreen },
  content: { padding: Spacing.screen, gap: 14 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingBottom: 0 },
  title:       { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  ptsPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', borderRadius: Radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  ptsPillText: { fontSize: 15, fontWeight: '900', color: Colors.gold },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
    padding: 14,
  },
  pendingIcon:  { fontSize: 24 },
  pendingTitle: { fontSize: 14, fontWeight: '900', color: Colors.gold },
  pendingDesc:  { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  // Filtres
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: Colors.border, paddingVertical: 9,
  },
  filterChipActive:    { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' },
  filterText:          { fontSize: 12, fontWeight: '800', color: Colors.textDim },
  filterTextActive:    { color: Colors.gold },
  filterBadge:         { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, minWidth: 20, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeActive:   { backgroundColor: 'rgba(255,184,0,0.2)' },
  filterBadgeText:     { fontSize: 10, fontWeight: '900', color: Colors.textFaint },
  filterBadgeTextActive:{ color: Colors.gold },

  // Grille
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  card: {
    width: '47%',
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, alignItems: 'center', gap: 8,
    position: 'relative',
  },
  cardAvail:   { borderColor: 'rgba(255,184,0,0.25)', backgroundColor: 'rgba(255,184,0,0.04)' },
  cardPending: { borderColor: 'rgba(255,184,0,0.2)', opacity: 0.8 },

  pendingPill: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  pendingPillText: { fontSize: 9, fontWeight: '900', color: Colors.gold },
  lockPill:    { position: 'absolute', top: 8, right: 8 },
  lockPillText:{ fontSize: 13 },

  cardEmoji: { fontSize: 38, marginTop: 4 },
  cardName:  { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', lineHeight: 17 },

  costBadge:      { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  costBadgeLocked:{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  costBadgePending:{ backgroundColor: 'rgba(255,184,0,0.08)', borderColor: 'rgba(255,184,0,0.15)' },
  costText:       { fontSize: 13, fontWeight: '900', color: Colors.gold },
  costTextLocked: { color: Colors.textDim },
  costTextPending:{ color: 'rgba(255,184,0,0.6)' },

  progressTrack: { width: '100%', height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 99, backgroundColor: 'rgba(255,184,0,0.4)' },
  missingText:   { fontSize: 10, fontWeight: '700', color: Colors.textFaint },

  claimBtn:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 2 },
  claimBtnText: { fontSize: 12, fontWeight: '900', color: '#1a1000' },
});
