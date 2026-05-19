import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, Pressable, Image } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { tasksApi } from '@/lib/api/tasks';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';
import { transactionsApi } from '@/lib/api/transactions';
import { familiesApi } from '@/lib/api/families';
import { formatName } from '@/lib/formatName';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

type PendingTask = { id: string; childName: string; childEmoji: string; childColor: string; taskName: string; pts: number; ago: string; note?: string; photoUrl?: string; };
type RewardRequest = { id: string; childName: string; childEmoji: string; rewardName: string; emoji: string; pts: number; };

function formatAgo(dateStr?: string): string {

  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)} j`;
}

export default function ParentDashboardScreen() {
  const { user } = useAuth();
  const { data: profileData, refresh: profileRefresh } = useApiData(() => familiesApi.getMe(), []);
  const parentName = formatName(profileData?.name, profileData?.email) || 'Bonjour';
  const [addModal, setAddModal]         = useState(false);
  const [reviewTask, setReviewTask]     = useState<PendingTask | null>(null);
  const [balances, setBalances]         = useState<Record<string, number>>({});
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();
  const slideAnim = useRef(new Animated.Value(300)).current;

  const {
    data: childrenData,
    loading: childrenLoading,
    error: childrenError,
    refresh: childrenRefresh,
  } = useApiData(() => childrenApi.list(), []);

  const {
    data: pendingData,
    loading: pendingLoading,
    error: pendingError,
    refresh: pendingRefresh,
  } = useApiData(() => tasksApi.list(undefined, 'pending_approval'), []);

  const {
    data: rewardsData,
    loading: rewardsLoading,
    error: rewardsError,
    refresh: rewardsRefresh,
  } = useApiData(() => rewardsApi.list(), []);

  const {
    data: todoData,
    loading: todoLoading,
    refresh: todoRefresh,
  } = useApiData(() => tasksApi.list(undefined, 'created'), []);

  async function refreshBalances(children: typeof childrenData) {
    if (!children?.length) return;
    const entries = await Promise.all(
      children.map(c => transactionsApi.getBalance(c.id).then(b => [c.id, b.balance] as const).catch(() => [c.id, 0] as const))
    );
    setBalances(Object.fromEntries(entries));
  }

  useEffect(() => { refreshBalances(childrenData); }, [childrenData]);

  // Refresh toutes les données quand l'écran revient au premier plan
  useFocusEffect(useCallback(() => {
    profileRefresh();
    childrenRefresh();
    pendingRefresh();
    rewardsRefresh();
    todoRefresh();
  }, []));

  const pending: PendingTask[] = (pendingData ?? []).map(task => ({
    id: task.id,
    childName: task.child.name,
    childEmoji: task.child.avatar,
    childColor: task.child.color ?? '#FFB300',
    taskName: task.title,
    pts: task.points,
    ago: formatAgo(task.submittedAt),
    note: task.note,
    photoUrl: task.photoUrl,
  }));

  const rewards: RewardRequest[] = (rewardsData ?? [])
    .filter(r => r.status === 'claimed')
    .map(r => ({
      id: r.id,
      childName: r.childName ?? '?',
      childEmoji: r.childEmoji ?? '👶',
      rewardName: r.title,
      emoji: r.emoji,
      pts: r.cost,
    }));

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
      message: `${r.childEmoji} ${r.childName} recevra sa récompense.\nLes ${r.pts} pts seront débités.`,
      buttons: [
        { label: 'Accorder 🎉', style: 'default', onPress: async () => {
          try {
            await rewardsApi.grant(id);
            rewardsRefresh();
            refreshBalances(childrenData);
            showModal({ icon: '🎉', title: 'Récompense accordée !', message: `${r.childName} va être ravi·e !`, buttons: [{ label: 'Super !', style: 'default' }] });
          } catch (err) {
            rewardsRefresh();
            const alreadyDone = err instanceof ApiError && err.status === 409;
            showModal({
              icon: alreadyDone ? 'ℹ️' : '❌',
              title: alreadyDone ? 'Déjà traité' : 'Erreur',
              message: alreadyDone ? 'L\'autre parent a déjà accordé cette récompense.' : 'Une erreur est survenue, réessaie.',
              buttons: [{ label: 'OK', style: 'default' }],
            });
          }
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
      message: `La demande de ${r.childName} sera annulée.`,
      buttons: [
        { label: 'Refuser', style: 'destructive', onPress: async () => {
          try {
            await rewardsApi.refuse(id);
            rewardsRefresh();
            showModal({ icon: '✅', title: 'Demande refusée', message: `La demande de "${r.rewardName}" a été annulée.`, buttons: [{ label: 'OK', style: 'default' }] });
          } catch (err) {
            rewardsRefresh();
            const alreadyDone = err instanceof ApiError && err.status === 409;
            showModal({
              icon: alreadyDone ? 'ℹ️' : '❌',
              title: alreadyDone ? 'Déjà traité' : 'Erreur',
              message: alreadyDone ? 'L\'autre parent a déjà traité cette récompense.' : 'Une erreur est survenue, réessaie.',
              buttons: [{ label: 'OK', style: 'default' }],
            });
          }
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  function goTo(path: '/(parent)/create-task' | '/(parent)/create-reward') {
    closeAddModal();
    setTimeout(() => router.push(path), 220);
  }

  async function confirmApprove(task: PendingTask) {
    setReviewTask(null);
    try {
      await tasksApi.approve(task.id);
      pendingRefresh();
      refreshBalances(childrenData);
      showModal({
        icon: '✅',
        title: 'Tâche validée !',
        message: `${task.taskName} de ${task.childName} validée.\n+${task.pts} pts crédités.`,
        buttons: [{ label: 'Super !', style: 'default' }],
      });
    } catch (err) {
      pendingRefresh();
      const alreadyDone = err instanceof ApiError && err.status === 409;
      showModal({
        icon: alreadyDone ? 'ℹ️' : '❌',
        title: alreadyDone ? 'Déjà validée' : 'Erreur',
        message: alreadyDone ? 'L\'autre parent a déjà validé cette tâche.' : 'Une erreur est survenue, réessaie.',
        buttons: [{ label: 'OK', style: 'default' }],
      });
    }
  }

  function confirmReject(task: PendingTask) {
    setReviewTask(null);
    showModal({
      icon: '❌',
      title: 'Rejeter la tâche ?',
      message: `${task.taskName} de ${task.childName} sera rejetée.`,
      buttons: [
        { label: 'Rejeter', style: 'destructive', onPress: async () => {
          try {
            await tasksApi.reject(task.id);
            pendingRefresh();
            todoRefresh();
          } catch (err) {
            pendingRefresh();
            const alreadyDone = err instanceof ApiError && err.status === 409;
            showModal({
              icon: alreadyDone ? 'ℹ️' : '❌',
              title: alreadyDone ? 'Déjà traitée' : 'Erreur',
              message: alreadyDone ? 'L\'autre parent a déjà traité cette tâche.' : 'Une erreur est survenue, réessaie.',
              buttons: [{ label: 'OK', style: 'default' }],
            });
          }
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  if (childrenLoading && !childrenData) return <LoadingScreen />;
  if (childrenError && !childrenData) return <ErrorScreen message={childrenError} onRetry={childrenRefresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.sub}>Bonjour,</Text>
            <Text style={styles.title}>{parentName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => router.push({ pathname: '/(auth)/child-select', params: { fromParent: 'true' } })}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnLabel}>Enfant</Text>
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
          {(childrenData ?? []).map((child) => (
            <TouchableOpacity key={child.id} style={[styles.childCard, styles.childCardAlert]} onPress={() => router.push({ pathname: '/(parent)/edit-child', params: { childId: child.id, childName: child.name, childEmoji: child.avatar, childColor: child.color } })} activeOpacity={0.8}>
              <View style={[styles.childAvatar, { backgroundColor: child.color ?? '#FFB300', shadowColor: child.color ?? '#FFB300' }]}>
                <Text style={{ fontSize: 26 }}>{child.avatar}</Text>
              </View>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childPts}>⭐ {balances[child.id] ?? 0} pts</Text>
              <View style={styles.childTrack}>
                <View style={[styles.childFill, { width: '0%' }]} />
              </View>
              <Text style={styles.childReward}>—</Text>
            </TouchableOpacity>
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

        {/* Tâches à faire */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>TÂCHES EN COURS</Text>
          {(todoData ?? []).length > 0 && <Text style={styles.todoCount}>{(todoData ?? []).length}</Text>}
        </View>

        {todoLoading && !todoData ? (
          <View style={styles.emptyPending}>
            <Text style={styles.emptyText}>Chargement…</Text>
          </View>
        ) : (todoData ?? []).length === 0 ? (
          <View style={styles.emptyPending}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>📋</Text>
            <Text style={styles.emptyText}>Aucune tâche active</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {(todoData ?? []).map(task => {
              const wasRejected = task.rejectionReason != null;
              return (
                <View key={task.id} style={[styles.todoCard, wasRejected && styles.todoCardRejected]}>
                  <View style={[styles.childAvatarSm, { backgroundColor: task.child.color ?? '#FFB300' }]}>
                    <Text style={{ fontSize: 18 }}>{task.child.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingTask}>{task.title}</Text>
                    <Text style={styles.pendingMeta}>
                      {task.child.name}{task.frequency !== 'once' ? ` · ${task.frequency === 'daily' ? 'quotidien' : 'hebdo'}` : ''}
                    </Text>
                    {wasRejected && (
                      <Text style={styles.todoRejectedLabel}>
                        ↩ Rejeté{task.rejectionReason ? ` — ${task.rejectionReason}` : ''}
                      </Text>
                    )}
                  </View>
                  <View style={styles.ptsBadge}>
                    <Text style={styles.ptsBadgeText}>+{task.points} pts</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Pending validations */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>À VALIDER</Text>
          {pending.length > 0 && <Text style={styles.pendingCount}>{pending.length}</Text>}
        </View>

        {pendingLoading && !pendingData ? (
          <View style={styles.emptyPending}>
            <Text style={styles.emptyText}>Chargement…</Text>
          </View>
        ) : pendingError && !pendingData ? (
          <View style={styles.emptyPending}>
            <Text style={styles.emptyText}>{pendingError}</Text>
          </View>
        ) : pending.length === 0 ? (
          <View style={styles.emptyPending}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
            <Text style={styles.emptyText}>Tout est validé !</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pending.map(task => (
              <TouchableOpacity key={task.id} style={styles.pendingCard} onPress={() => setReviewTask(task)} activeOpacity={0.8}>
                <View style={[styles.childAvatarSm, { backgroundColor: task.childColor }]}><Text style={{ fontSize: 18 }}>{task.childEmoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTask}>{task.taskName}</Text>
                  <Text style={styles.pendingMeta}>{task.childName} · {task.ago}{task.note ? ' · 💬' : ''}{task.photoUrl ? ' · 📷' : ''}</Text>
                </View>
                <View style={styles.ptsBadge}><Text style={styles.ptsBadgeText}>+{task.pts} pts</Text></View>
                <Text style={{ fontSize: 16, color: Colors.textFaint }}>›</Text>
              </TouchableOpacity>
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

        {rewardsLoading && !rewardsData ? (
          <View style={styles.emptyPending}>
            <Text style={styles.emptyText}>Chargement…</Text>
          </View>
        ) : rewardsError && !rewardsData ? (
          <View style={styles.emptyPending}>
            <Text style={styles.emptyText}>{rewardsError}</Text>
          </View>
        ) : rewards.length === 0 ? (
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

      {/* ── Modal review tâche ── */}
      <Modal visible={!!reviewTask} transparent animationType="slide" onRequestClose={() => setReviewTask(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setReviewTask(null)}>
          <Pressable style={styles.reviewSheet}>
            <View style={styles.modalHandle} />
            {reviewTask && (
              <>
                <View style={styles.reviewHeader}>
                  <View style={[styles.childAvatarSm, { backgroundColor: reviewTask.childColor }]}><Text style={{ fontSize: 22 }}>{reviewTask.childEmoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewTaskName}>{reviewTask.taskName}</Text>
                    <Text style={styles.reviewMeta}>{reviewTask.childName} · {reviewTask.ago}</Text>
                  </View>
                  <View style={styles.ptsBadge}><Text style={styles.ptsBadgeText}>+{reviewTask.pts} pts</Text></View>
                </View>

                {reviewTask.note ? (
                  <View style={styles.reviewNote}>
                    <Text style={styles.reviewNoteLabel}>Message de {reviewTask.childName}</Text>
                    <Text style={styles.reviewNoteText}>"{reviewTask.note}"</Text>
                  </View>
                ) : null}

                {reviewTask.photoUrl ? (
                  <Image source={{ uri: reviewTask.photoUrl }} style={styles.reviewPhoto} resizeMode="cover" />
                ) : null}

                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.btnRejectLg} onPress={() => confirmReject(reviewTask)} activeOpacity={0.8}>
                    <Text style={styles.btnRejectLgText}>✕  Rejeter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnApproveLg} onPress={() => confirmApprove(reviewTask)} activeOpacity={0.8}>
                    <Text style={styles.btnApproveLgText}>✓  Valider</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
  switchBtn:      { paddingHorizontal: 12, height: 36, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  switchBtnLabel: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  addBtn:        { width: 44, height: 44, backgroundColor: Colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText:    { fontSize: 24, fontWeight: '900', color: '#1a1000', lineHeight: 28 },

  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.screen, marginBottom: 14, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.22)', borderRadius: 16, padding: 12 },
  urgentCount:  { fontSize: 14, fontWeight: '900', color: Colors.orange },
  urgentSub:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,107,53,0.6)', marginTop: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginBottom: 10 },
  sectionTitle:  { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  pendingCount:  { fontSize: 12, fontWeight: '900', color: Colors.orange },
  todoCount:     { fontSize: 12, fontWeight: '900', color: Colors.textDim },
  todoCard:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border },
  todoCardRejected: { borderColor: 'rgba(239,83,80,0.25)', backgroundColor: 'rgba(239,83,80,0.05)' },
  todoRejectedLabel:{ fontSize: 11, fontWeight: '700', color: 'rgba(239,83,80,0.8)', marginTop: 2 },

  childScroll: { paddingHorizontal: Spacing.screen, gap: 12, paddingBottom: 4 },
  childCard:   { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, width: 150, gap: 8, marginBottom: 16, position: 'relative' },
  childCardAlert: { borderColor: 'rgba(255,184,0,0.2)' },
  pendingDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.orange, borderWidth: 2, borderColor: Colors.bgCard },
  childAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 6 },
  childName:  { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  childPts:   { fontSize: 13, fontWeight: '800', color: Colors.gold },
  childTrack: { height: 5, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  childFill:  { height: '100%', borderRadius: Radii.pill, backgroundColor: Colors.gold },
  childReward:{ fontSize: 10, fontWeight: '700', color: Colors.textFaint },
  addChildCard: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', width: 150, height: 140, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.5 },
  addChildText: { fontSize: 13, fontWeight: '800', color: Colors.textDim },

  list:       { paddingHorizontal: Spacing.screen, gap: 10 },
  pendingCard:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border },
  childAvatarSm: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
  // Review modal
  reviewSheet: {
    backgroundColor: '#1e1e26', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 16,
  },
  reviewHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewTaskName: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  reviewMeta:     { fontSize: 12, fontWeight: '600', color: Colors.textDim, marginTop: 2 },
  reviewNote: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14,
  },
  reviewNoteLabel: { fontSize: 11, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  reviewNoteText:  { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, fontStyle: 'italic' },
  reviewPhoto:     { width: '100%', height: 200, borderRadius: 16 },
  reviewActions:   { flexDirection: 'row', gap: 12 },
  btnRejectLg:     { flex: 1, backgroundColor: 'rgba(239,83,80,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,83,80,0.25)', padding: 16, alignItems: 'center' },
  btnRejectLgText: { fontSize: 15, fontWeight: '900', color: '#EF5350' },
  btnApproveLg:    { flex: 1, backgroundColor: Colors.green, borderRadius: 16, padding: 16, alignItems: 'center' },
  btnApproveLgText:{ fontSize: 15, fontWeight: '900', color: '#fff' },

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
