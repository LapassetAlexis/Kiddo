import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';

type RewardStatus = 'available' | 'locked' | 'pending';
interface Reward { id: string; name: string; emoji: string; cost: number; status: RewardStatus; }

const MY_PTS = 120;

const REWARDS: Reward[] = [
  { id: '1', name: 'Soirée TV',        emoji: '📺', cost: 50,  status: 'available' },
  { id: '2', name: 'Choisir le dîner', emoji: '🍕', cost: 80,  status: 'available' },
  { id: '3', name: '1h de jeu vidéo',  emoji: '🎮', cost: 60,  status: 'pending'   },
  { id: '4', name: 'Sortie au parc',   emoji: '🌳', cost: 100, status: 'locked'    },
  { id: '5', name: 'Cinéma',           emoji: '🎬', cost: 120, status: 'locked'    },
  { id: '6', name: 'Nuit chez un ami', emoji: '🏕️', cost: 150, status: 'locked'    },
  { id: '7', name: 'Dessert spécial',  emoji: '🍰', cost: 40,  status: 'available' },
  { id: '8', name: 'Choisir le film',  emoji: '🎥', cost: 30,  status: 'locked'    },
];

type Filter = 'all' | 'available' | 'locked';

export default function RewardsScreen() {
  const [filter, setFilter]         = useState<Filter>('all');
  const [claimed, setClaimed]       = useState<Set<string>>(new Set());
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const rewards = REWARDS.map(r => ({
    ...r,
    status: claimed.has(r.id) ? 'pending' as RewardStatus : r.status,
  }));

  const available = rewards.filter(r => r.status === 'available');
  const pending   = rewards.filter(r => r.status === 'pending');
  const locked    = rewards.filter(r => r.status === 'locked');

  const displayed = filter === 'all' ? rewards
    : filter === 'available' ? [...available, ...pending]
    : locked;

  function claim(r: Reward) {
    if (r.status !== 'available') return;
    showModal({
      icon: r.emoji,
      title: `Réclamer "${r.name}" ?`,
      message: `Cela coûte ${r.cost} pts.\nPapa / Maman va recevoir ta demande et devra l'approuver.`,
      buttons: [
        {
          label: 'Réclamer 🎉', style: 'default',
          onPress: () => {
            setClaimed(s => new Set([...s, r.id]));
            showModal({
              icon: '⏳',
              title: 'Demande envoyée !',
              message: `Papa / Maman va valider ta récompense "${r.name}" très bientôt.`,
              buttons: [{ label: 'Super !', style: 'default' }],
            });
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
        <Text style={styles.title}>Récompenses 🎁</Text>
        <View style={styles.ptsPill}>
          <Text style={{ fontSize: 14 }}>⭐</Text>
          <Text style={styles.ptsPillText}>{MY_PTS} pts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Récompenses en attente */}
        {pending.length > 0 && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>
                {pending.length} récompense{pending.length > 1 ? 's' : ''} en attente
              </Text>
              <Text style={styles.pendingDesc}>Papa / Maman doit valider</Text>
            </View>
          </View>
        )}

        {/* Filtres */}
        <View style={styles.filterRow}>
          {([
            { value: 'all'      as Filter, label: 'Toutes', count: rewards.length },
            { value: 'available'as Filter, label: '🔓 Dispo', count: available.length + pending.length },
            { value: 'locked'   as Filter, label: '🔒 Bientôt', count: locked.length },
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
            const progress  = Math.min(1, MY_PTS / r.cost);
            const missing   = r.cost - MY_PTS;
            const isAvail   = r.status === 'available';
            const isPending = r.status === 'pending';
            const isLocked  = r.status === 'locked';

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
                  {r.name}
                </Text>

                {/* Coût */}
                <View style={[styles.costBadge, isLocked && styles.costBadgeLocked, isPending && styles.costBadgePending]}>
                  <Text style={[styles.costText, isLocked && styles.costTextLocked, isPending && styles.costTextPending]}>
                    {r.cost} pts
                  </Text>
                </View>

                {/* Barre de progression (locked seulement) */}
                {isLocked && (
                  <>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                    <Text style={styles.missingText}>encore {missing} pts</Text>
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
