import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, Pressable } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';

const CHILDREN = [
  { id: '1', name: 'Lucas', emoji: '🦊', pts: 120, nextReward: 'Soirée TV',   progress: 0.70, pending: 1 },
  { id: '2', name: 'Emma',  emoji: '🐻', pts: 85,  nextReward: 'Sortie parc', progress: 0.57, pending: 1 },
];

type PendingTask = { id: string; childName: string; childEmoji: string; taskName: string; pts: number; ago: string; };

const INITIAL_PENDING: PendingTask[] = [
  { id: '1', childName: 'Lucas', childEmoji: '🦊', taskName: 'Ranger sa chambre', pts: 30, ago: 'il y a 12 min' },
  { id: '2', childName: 'Emma',  childEmoji: '🐻', taskName: 'Mettre la table',    pts: 10, ago: 'il y a 3 min'  },
];

type RewardRequest = { id: string; childName: string; childEmoji: string; rewardName: string; emoji: string; pts: number; };

const INITIAL_REWARDS: RewardRequest[] = [
  { id: '1', childName: 'Lucas', childEmoji: '🦊', rewardName: 'Soirée TV', emoji: '📺', pts: 50 },
];

export default function ParentDashboardScreen() {
  const [pending, setPending]       = useState<PendingTask[]>(INITIAL_PENDING);
  const [rewards, setRewards]       = useState<RewardRequest[]>(INITIAL_REWARDS);
  const [addModal, setAddModal]     = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();
  const slideAnim = useRef(new Animated.Value(300)).current;

  function openAddModal() {
    setAddModal(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  }

  function closeAddModal() {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => setAddModal(false));
  }

  function grantReward(id: string) {
    const r = rewards.find(x => x.id === id);
    if (!r) return;
    showModal({
      icon: r.emoji,
      title: `Accorder "${r.rewardName}" ?`,
      message: `${r.childEmoji} ${r.childName} recevra sa récompense.\nLes ${r.pts} pts sont déjà débités.`,
      buttons: [
        { label: 'Accorder 🎉', style: 'default', onPress: () => {
          setRewards(rs => rs.filter(x => x.id !== id));
          showModal({ icon: '🎉', title: 'Récompense accordée !', message: `${r.childName} va être ravi·e !`, buttons: [{ label: 'Super !', style: 'default' }] });
        }},
        { label: 'Pas maintenant', style: 'cancel' },
      ],
    });
  }

  function refuseReward(id: string) {
    const r = rewards.find(x => x.id === id);
    if (!r) return;
    showModal({
      icon: '↩️',
      title: `Refuser "${r.rewardName}" ?`,
      message: `Les ${r.pts} pts seront recrédités à ${r.childName}.`,
      buttons: [
        { label: 'Refuser et recréditer', style: 'destructive', onPress: () => {
          setRewards(rs => rs.filter(x => x.id !== id));
          showModal({ icon: '✅', title: 'Points recrédités', message: `${r.pts} pts rendus à ${r.childName}.`, buttons: [{ label: 'OK', style: 'default' }] });
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  function goTo(path: '/(parent)/create-task' | '/(parent)/create-reward') {
    closeAddModal();
    setTimeout(() => router.push(path), 220);
  }

  function approve(id: string) {
    const task = pending.find(t => t.id === id);
    setPending(p => p.filter(t => t.id !== id));
    showModal({
      icon: '✅',
      title: 'Tâche validée !',
      message: `${task?.taskName} de ${task?.childName} validée.\n+${task?.pts} pts crédités.`,
      buttons: [{ label: 'Super !', style: 'default' }],
    });
  }

  function reject(id: string) {
    const task = pending.find(t => t.id === id);
    showModal({
      icon: '❌',
      title: 'Rejeter la tâche ?',
      message: `${task?.taskName} de ${task?.childName} sera rejetée et l'enfant en sera notifié.`,
      buttons: [
        { label: 'Rejeter', style: 'destructive', onPress: () => setPending(p => p.filter(t => t.id !== id)) },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.sub}>Bonjour,</Text>
            <Text style={styles.title}>Marie 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => router.push({ pathname: '/(auth)/child-select', params: { fromParent: 'true' } })}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnText}>👶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgent banner */}
        {pending.length > 0 && (
          <View style={styles.urgentBanner}>
            <Text style={{ fontSize: 20 }}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgentCount}>{pending.length} tâche{pending.length > 1 ? 's' : ''} à valider</Text>
              <Text style={styles.urgentSub}>{pending.map(p => p.childName).join(' et ')} attendent</Text>
            </View>
          </View>
        )}

        {/* Children */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MES ENFANTS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childScroll}>
          {CHILDREN.map(child => (
            <View key={child.id} style={[styles.childCard, child.pending > 0 && styles.childCardAlert]}>
              {child.pending > 0 && <View style={styles.pendingDot} />}
              <View style={[styles.childAvatar, child.id === '2' && styles.childAvatarBlue]}>
                <Text style={{ fontSize: 26 }}>{child.emoji}</Text>
              </View>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childPts}>⭐ {child.pts} pts</Text>
              <View style={styles.childTrack}>
                <View style={[styles.childFill, { width: `${Math.round(child.progress * 100)}%` }]} />
              </View>
              <Text style={styles.childReward}>{child.nextReward} ({Math.round(child.progress * 100)}%)</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addChildCard}
            onPress={() => router.push('/(parent)/create-child')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 28, color: Colors.textFaint }}>＋</Text>
            <Text style={styles.addChildText}>Ajouter</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Pending validations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À VALIDER</Text>
          {pending.length > 0 && <Text style={styles.pendingCount}>{pending.length}</Text>}
        </View>

        {pending.length === 0 ? (
          <View style={styles.emptyPending}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
            <Text style={styles.emptyText}>Tout est validé !</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pending.map(task => (
              <View key={task.id} style={styles.pendingCard}>
                <View style={styles.childAvatarSm}><Text style={{ fontSize: 18 }}>{task.childEmoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTask}>{task.taskName}</Text>
                  <Text style={styles.pendingMeta}>{task.childName} · {task.ago}</Text>
                </View>
                <View style={styles.ptsBadge}><Text style={styles.ptsBadgeText}>+{task.pts} pts</Text></View>
                <TouchableOpacity style={styles.btnApprove} onPress={() => approve(task.id)}>
                  <Text style={{ color: Colors.green, fontSize: 17 }}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => reject(task.id)}>
                  <Text style={{ color: '#EF5350', fontSize: 17 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reward requests */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>RÉCOMPENSES RÉCLAMÉES</Text>
          {rewards.length > 0 && (
            <Text style={styles.pendingCount}>{rewards.length}</Text>
          )}
        </View>

        {rewards.length === 0 ? (
          <View style={styles.emptyPending}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🎁</Text>
            <Text style={styles.emptyText}>Aucune récompense en attente</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rewards.map(r => (
              <View key={r.id} style={[styles.pendingCard, { borderColor: 'rgba(255,184,0,0.18)' }]}>
                <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTask}>{r.rewardName}</Text>
                  <Text style={styles.pendingMeta}>
                    {r.childEmoji} {r.childName} · {r.pts} pts débités
                  </Text>
                </View>
                <TouchableOpacity style={styles.btnApprove} onPress={() => grantReward(r.id)} aria-label="Accorder">
                  <Text style={{ color: Colors.green, fontSize: 17 }}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => refuseReward(r.id)} aria-label="Refuser">
                  <Text style={{ color: '#EF5350', fontSize: 17 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />

      {/* ── Modal Ajouter ── */}
      <Modal visible={addModal} transparent animationType="none" onRequestClose={closeAddModal}>
        <Pressable style={styles.modalOverlay} onPress={closeAddModal}>
          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <Pressable>
              {/* Handle */}
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Ajouter</Text>
              <Text style={styles.modalSub}>Que veux-tu créer ?</Text>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => goTo('/(parent)/create-task')}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnIcon}>📋</Text>
                <View style={styles.modalBtnText}>
                  <Text style={styles.modalBtnLabel}>Une tâche</Text>
                  <Text style={styles.modalBtnDesc}>Assigne une mission à tes enfants</Text>
                </View>
                <Text style={styles.modalBtnArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => goTo('/(parent)/create-reward')}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnIcon}>🎁</Text>
                <View style={styles.modalBtnText}>
                  <Text style={styles.modalBtnLabel}>Une récompense</Text>
                  <Text style={styles.modalBtnDesc}>Crée un cadeau à échanger contre des points</Text>
                </View>
                <Text style={styles.modalBtnArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancel} onPress={closeAddModal} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingTop: 12 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sub:           { fontSize: 13, fontWeight: '600', color: Colors.textDim },
  title:         { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  switchBtn:     { width: 44, height: 44, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  switchBtnText: { fontSize: 22 },
  addBtn:        { width: 44, height: 44, backgroundColor: Colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText:    { fontSize: 24, fontWeight: '900', color: '#1a1000', lineHeight: 28 },

  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.screen, marginBottom: 14, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.22)', borderRadius: 16, padding: 12 },
  urgentCount:  { fontSize: 14, fontWeight: '900', color: Colors.orange },
  urgentSub:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,107,53,0.6)', marginTop: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginBottom: 10 },
  sectionTitle:  { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  pendingCount:  { fontSize: 12, fontWeight: '900', color: Colors.orange },

  childScroll: { paddingHorizontal: Spacing.screen, gap: 12, paddingBottom: 4 },
  childCard:   { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, width: 150, gap: 8, marginBottom: 16, position: 'relative' },
  childCardAlert: { borderColor: 'rgba(255,184,0,0.2)' },
  pendingDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.orange, borderWidth: 2, borderColor: Colors.bgCard },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.gold, shadowOpacity: 0.3, shadowRadius: 6 },
  childAvatarBlue: { backgroundColor: '#1565C0', shadowColor: '#42A5F5' },
  childName:  { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  childPts:   { fontSize: 13, fontWeight: '800', color: Colors.gold },
  childTrack: { height: 5, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  childFill:  { height: '100%', borderRadius: Radii.pill, backgroundColor: Colors.gold },
  childReward:{ fontSize: 10, fontWeight: '700', color: Colors.textFaint },
  addChildCard: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', width: 150, height: 140, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.5 },
  addChildText: { fontSize: 13, fontWeight: '800', color: Colors.textDim },

  list:       { paddingHorizontal: Spacing.screen, gap: 10 },
  pendingCard:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border },
  childAvatarSm: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  pendingTask:{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  pendingMeta:{ fontSize: 11, fontWeight: '600', color: Colors.textDim, marginTop: 2 },
  ptsBadge:   { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.18)', borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  ptsBadgeText: { fontSize: 12, fontWeight: '900', color: Colors.gold },
  btnApprove: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)', alignItems: 'center', justifyContent: 'center' },
  btnReject:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,83,80,0.1)',  borderWidth: 1, borderColor: 'rgba(239,83,80,0.2)',  alignItems: 'center', justifyContent: 'center' },
  grantBtn:   { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  grantBtnText: { fontSize: 13, fontWeight: '900', color: '#1a1000' },
  emptyPending: { alignItems: 'center', padding: 32 },
  emptyText:    { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e1e26',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  modalSub:   { fontSize: 13, fontWeight: '600', color: Colors.textDim, marginBottom: 20 },

  modalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.orange,
    borderRadius: 18, padding: 18, marginBottom: 12,
  },
  modalBtnIcon:  { fontSize: 26 },
  modalBtnText:  { flex: 1 },
  modalBtnLabel: { fontSize: 16, fontWeight: '900', color: '#fff' },
  modalBtnDesc:  { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  modalBtnArrow: { fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: '300' },

  modalCancel: {
    alignItems: 'center', padding: 16,
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, marginTop: 4,
  },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: Colors.textDim },
});
