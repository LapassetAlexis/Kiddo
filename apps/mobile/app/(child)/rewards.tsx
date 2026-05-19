import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';

const REWARDS = [
  { id: '1', name: 'Soirée TV',        emoji: '📺', cost: 50,  available: true  },
  { id: '2', name: 'Choisir le dîner', emoji: '🍕', cost: 80,  available: true  },
  { id: '3', name: 'Sortie au parc',   emoji: '🌳', cost: 100, available: false },
  { id: '4', name: '1h de jeu vidéo',  emoji: '🎮', cost: 60,  available: false },
  { id: '5', name: 'Nuit chez un ami', emoji: '🏕️', cost: 150, available: false },
  { id: '6', name: 'Cinéma',           emoji: '🎬', cost: 120, available: false },
];

const MY_PTS = 120;

export default function RewardsScreen() {
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  function claim(reward: typeof REWARDS[0]) {
    if (!reward.available) return;
    showModal({
      icon: reward.emoji,
      title: `Réclamer "${reward.name}" ?`,
      message: `Cela coûte ${reward.cost} pts.\nPapa/Maman va recevoir ta demande.`,
      buttons: [
        { label: 'Réclamer 🎉', style: 'default', onPress: () => { /* TODO: POST /rewards/:id/redeem */ } },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Récompenses 🎁</Text>
        <View style={styles.ptsPill}><Text style={{ fontSize: 14 }}>⭐</Text><Text style={styles.ptsPillText}>{MY_PTS} pts</Text></View>
      </View>

      <FlatList
        data={REWARDS}
        keyExtractor={r => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: Spacing.screen, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const missing = item.cost - MY_PTS;
          return (
            <TouchableOpacity
              style={[styles.card, !item.available && styles.cardLocked]}
              onPress={() => claim(item)}
              activeOpacity={item.available ? 0.75 : 1}
            >
              {!item.available && <Text style={styles.lockIcon}>🔒</Text>}
              <Text style={[styles.emoji, !item.available && { opacity: 0.5 }]}>{item.emoji}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.costBadge, !item.available && styles.costBadgeLocked]}>
                <Text style={[styles.costText, !item.available && styles.costTextLocked]}>{item.cost} pts</Text>
              </View>
              {!item.available && missing > 0 && (
                <Text style={styles.missing}>encore {missing} pts</Text>
              )}
              {item.available && (
                <View style={styles.claimBtn}>
                  <Text style={styles.claimBtnText}>Réclamer</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgScreen },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingBottom: 0 },
  title:  { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  ptsPill:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', borderRadius: Radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  ptsPillText: { fontSize: 15, fontWeight: '900', color: Colors.gold },

  card:       { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 18, alignItems: 'center', gap: 8 },
  cardLocked: { opacity: 0.6 },
  lockIcon:   { position: 'absolute', top: 10, right: 10, fontSize: 13 },
  emoji:      { fontSize: 36 },
  name:       { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', lineHeight: 18 },
  costBadge:  { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  costBadgeLocked: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  costText:       { fontSize: 13, fontWeight: '900', color: Colors.gold },
  costTextLocked: { color: Colors.textDim },
  missing:    { fontSize: 10, fontWeight: '700', color: Colors.textFaint },
  claimBtn:   { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, marginTop: 2 },
  claimBtnText: { fontSize: 12, fontWeight: '900', color: '#1a1000' },
});
