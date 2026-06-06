import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Animated, Pressable, Image } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { tasksApi } from '@/lib/api/tasks';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';
import { transactionsApi } from '@/lib/api/transactions';
import { familiesApi } from '@/lib/api/families';
import { formatName } from '@/lib/formatName';
import { formatAgo } from '@/lib/formatters';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

type PendingTask = { id: string; childName: string; childEmoji: string; childColor: string; taskName: string; goldReward: number; ago: string; note?: string; photoUrl?: string; timesPerDay: number; completedToday: number; bonusGold: number; };
type RewardRequest = { id: string; childName: string; childEmoji: string; rewardName: string; emoji: string; pts: number; };

export default function ParentDashboardScreen() {
  const { bottom } = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: profileData, refresh: profileRefresh } = useApiData(() => familiesApi.getMe(), []);
  const parentName = formatName(profileData?.name, profileData?.email) || 'Bonjour';
  const [addModal, setAddModal]                 = useState(false);
  const [reviewTask, setReviewTask]             = useState<PendingTask | null>(null);
  const [balances, setBalances]                 = useState<Record<string, number>>({});
  const [exceptModal, setExceptModal]           = useState(false);
  const [exceptChildId, setExceptChildId]       = useState('');
  const [exceptTitle, setExceptTitle]           = useState('');
  const [exceptGold, setExceptGold]             = useState('20');
  const [exceptDiff, setExceptDiff]             = useState<'easy'|'medium'|'hard'|'very_hard'|'legendary'>('easy');
  const [exceptLoading, setExceptLoading]       = useState(false);
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
    goldReward: task.goldReward,
    ago: formatAgo(task.submittedAt),
    note: task.note,
    photoUrl: task.photoUrl,
    timesPerDay:    task.timesPerDay ?? 1,
    completedToday: task.completedToday ?? 0,
    bonusGold:      task.bonusGold ?? 0,
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
      message: `${r.childEmoji} ${r.childName} recevra sa récompense.\nLes ${r.pts} 🪙 seront débités.`,
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
              message: alreadyDone ? 'L\'autre gardien a déjà accordé cette récompense.' : 'Une erreur est survenue, réessaie.',
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
              message: alreadyDone ? 'L\'autre gardien a déjà traité cette récompense.' : 'Une erreur est survenue, réessaie.',
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
      todoRefresh();
      refreshBalances(childrenData);
      showModal({
        icon: '✅',
        title: 'Quête validée !',
        message: `${task.taskName} de ${task.childName} validée.\n+${task.goldReward} 🪙 crédités.`,
        buttons: [{ label: 'Super !', style: 'default' }],
      });
    } catch (err) {
      pendingRefresh();
      const alreadyDone = err instanceof ApiError && err.status === 409;
      showModal({
        icon: alreadyDone ? 'ℹ️' : '❌',
        title: alreadyDone ? 'Déjà validée' : 'Erreur',
        message: alreadyDone ? 'L\'autre gardien a déjà validé cette quête.' : 'Une erreur est survenue, réessaie.',
        buttons: [{ label: 'OK', style: 'default' }],
      });
    }
  }

  function confirmReject(task: PendingTask) {
    setReviewTask(null);
    showModal({
      icon: '❌',
      title: 'Rejeter la quête ?',
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
              message: alreadyDone ? 'L\'autre gardien a déjà traité cette quête.' : 'Une erreur est survenue, réessaie.',
              buttons: [{ label: 'OK', style: 'default' }],
            });
          }
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  const XP_LABELS: Record<string, string> = { easy: 'Facile +10⭐', medium: 'Moyen +30⭐', hard: 'Difficile +60⭐', very_hard: 'Dur +100⭐', legendary: 'Légendaire +200⭐' };
  const DIFFS = ['easy','medium','hard','very_hard','legendary'] as const;

  async function sendExceptional() {
    if (!exceptChildId || !exceptTitle.trim() || !exceptGold) return;
    setExceptLoading(true);
    try {
      await tasksApi.exceptional({ childId: exceptChildId, title: exceptTitle.trim(), goldReward: parseInt(exceptGold, 10), difficulty: exceptDiff });
      setExceptModal(false);
      setExceptTitle(''); setExceptGold('20'); setExceptDiff('easy'); setExceptChildId('');
      childrenRefresh();
      showModal({ icon: '⚡', title: 'Quête exceptionnelle envoyée !', message: `${(childrenData ?? []).find(c => c.id === exceptChildId)?.name} reçoit ses récompenses.`, buttons: [{ label: 'Super !', style: 'default' }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible d\'envoyer la quête.', buttons: [{ label: 'OK', style: 'default' }] });
    } finally {
      setExceptLoading(false);
    }
  }

  if (childrenLoading && !childrenData) return <LoadingScreen />;
  if (childrenError && !childrenData) return <ErrorScreen message={childrenError} onRetry={childrenRefresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.sub}>Bonjour,</Text>
              <Text style={styles.title}>{parentName} 👋</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.exceptBtn}
              onPress={() => { setExceptChildId((childrenData ?? [])[0]?.id ?? ''); setExceptModal(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.exceptBtnText}>⚡</Text>
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
              <Text style={styles.urgentCount}>{pending.length} quête{pending.length > 1 ? 's' : ''} à valider</Text>
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
            <TouchableOpacity
              key={child.id}
              style={[styles.childCard, styles.childCardAlert]}
              onPress={() => router.push({ pathname: '/(auth)/child-pin', params: { name: child.name, childId: child.id, fromParent: 'true' } })}
              activeOpacity={0.8}
            >
              <View style={[styles.childAvatar, { backgroundColor: child.color ?? '#FFB300', shadowColor: child.color ?? '#FFB300' }]}>
                <Text style={{ fontSize: 26 }}>{child.avatar}</Text>
              </View>
              <Text style={styles.childName}>{child.name}</Text>
              <View style={styles.childLevelRow}>
                <Text style={styles.childLevelEmoji}>{child.levelEmoji}</Text>
                <View style={styles.childLevelBadge}>
                  <Text style={styles.childLevelBadgeText}>Niv. {child.level}</Text>
                </View>
              </View>
              <Text style={styles.childPts}>🪙 {balances[child.id] ?? 0}</Text>
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

        {/* Quêtes en cours */}
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
            <Text style={styles.emptyText}>Aucune quête active</Text>
            <Text style={styles.emptySubText}>Crée des tâches pour que tes héros puissent gagner de l'XP !</Text>
            <TouchableOpacity style={styles.emptyCTA} onPress={() => goTo('/(parent)/create-task')} activeOpacity={0.8}>
              <Text style={styles.emptyCTAText}>+ Créer une quête</Text>
            </TouchableOpacity>
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
                    <Text style={styles.ptsBadgeText}>+{task.goldReward} 🪙</Text>
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
                {task.timesPerDay > 1 && (
                  <View style={styles.repBadge}>
                    <Text style={styles.repBadgeText}>{task.completedToday + 1}/{task.timesPerDay}</Text>
                  </View>
                )}
                <View style={styles.ptsBadge}><Text style={styles.ptsBadgeText}>+{task.goldReward} 🪙</Text></View>
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
                    {r.childEmoji} {r.childName} · {r.pts} 🪙 débités
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

      {/* ── Modal quête exceptionnelle ── */}
      <Modal visible={exceptModal} transparent animationType="slide" onRequestClose={() => setExceptModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setExceptModal(false)}>
          <Pressable style={[styles.reviewSheet, { paddingBottom: 36 + bottom }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>⚡ Quête exceptionnelle</Text>

            {/* Sélecteur enfant */}
            <Text style={styles.fieldLabel}>Enfant</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(childrenData ?? []).map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.childChip, exceptChildId === child.id && styles.childChipActive]}
                    onPress={() => setExceptChildId(child.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 18 }}>{child.avatar}</Text>
                    <Text style={[styles.childChipText, exceptChildId === child.id && { color: Colors.gold }]}>{child.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Titre */}
            <Text style={styles.fieldLabel}>Ce qu'il/elle a fait</Text>
            <TextInput
              style={styles.exceptInput}
              placeholder="Ex : A aidé à ranger sans qu'on le demande"
              placeholderTextColor={Colors.textFaint}
              value={exceptTitle}
              onChangeText={setExceptTitle}
              maxLength={80}
            />

            {/* Pièces */}
            <Text style={styles.fieldLabel}>Pièces d'or 🪙</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {['10','20','30','50','100'].map(v => (
                <TouchableOpacity key={v} style={[styles.goldChip, exceptGold === v && styles.goldChipActive]} onPress={() => setExceptGold(v)} activeOpacity={0.7}>
                  <Text style={[styles.goldChipText, exceptGold === v && { color: Colors.gold }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulté */}
            <Text style={styles.fieldLabel}>Difficulté (XP)</Text>
            <View style={{ gap: 6, marginBottom: 20 }}>
              {DIFFS.map(d => (
                <TouchableOpacity key={d} style={[styles.diffRow, exceptDiff === d && styles.diffRowActive]} onPress={() => setExceptDiff(d)} activeOpacity={0.7}>
                  <Text style={[styles.diffText, exceptDiff === d && { color: Colors.gold }]}>{XP_LABELS[d]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, (!exceptChildId || !exceptTitle.trim() || exceptLoading) && { opacity: 0.5 }]}
              onPress={sendExceptional}
              disabled={!exceptChildId || !exceptTitle.trim() || exceptLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>{exceptLoading ? 'Envoi…' : '⚡ Valider la quête'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal review quête ── */}
      <Modal visible={!!reviewTask} transparent animationType="slide" onRequestClose={() => setReviewTask(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setReviewTask(null)}>
          <Pressable style={[styles.reviewSheet, { paddingBottom: 36 + bottom }]}>
            <View style={styles.modalHandle} />
            {reviewTask && (
              <>
                <View style={styles.reviewHeader}>
                  <View style={[styles.childAvatarSm, { backgroundColor: reviewTask.childColor }]}><Text style={{ fontSize: 22 }}>{reviewTask.childEmoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewTaskName}>{reviewTask.taskName}</Text>
                    <Text style={styles.reviewMeta}>{reviewTask.childName} · {reviewTask.ago}</Text>
                  </View>
                  <View style={styles.ptsBadge}><Text style={styles.ptsBadgeText}>+{reviewTask.goldReward} 🪙</Text></View>
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
            style={[styles.modalSheet, { paddingBottom: 36 + bottom, transform: [{ translateY: slideAnim }] }]}
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
                  <Text style={styles.modalBtnLabel}>Une quête</Text>
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
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo:    { width: 32, height: 32, borderRadius: 8 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sub:           { fontSize: 13, fontWeight: '600', color: Colors.textDim },
  title:         { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  addBtn:        { width: 44, height: 44, backgroundColor: Colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText:    { fontSize: 24, fontWeight: '900', color: '#1a1000', lineHeight: 28 },
  exceptBtn:     { width: 44, height: 44, backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  exceptBtnText: { fontSize: 22 },

  fieldLabel:    { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  exceptInput:   { backgroundColor: Colors.bgScreen, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 13, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 14 },
  childChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgScreen, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  childChipActive: { borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  childChipText: { fontSize: 13, fontWeight: '800', color: Colors.textDim },
  goldChip:      { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: Colors.bgScreen, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  goldChipActive:{ borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  goldChipText:  { fontSize: 14, fontWeight: '900', color: Colors.textDim },
  diffRow:       { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.bgScreen, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  diffRowActive: { borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  diffText:      { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  confirmBtn:    { backgroundColor: Colors.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
  confirmBtnText:{ fontSize: 16, fontWeight: '900', color: '#1a1000' },

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
  childCard:   { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, width: 150, minHeight: 160, gap: 8, marginBottom: 16, position: 'relative' },
  childCardAlert: { borderColor: 'rgba(255,184,0,0.2)' },
  childAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 6 },
  childName:  { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  childLevelRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  childLevelEmoji:     { fontSize: 14 },
  childLevelBadge:     { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  childLevelBadgeText: { fontSize: 10, fontWeight: '900', color: '#a78bfa' },
  childPts:   { fontSize: 13, fontWeight: '800', color: Colors.gold },
  addChildCard: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', width: 150, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.5 },
  addChildText: { fontSize: 13, fontWeight: '800', color: Colors.textDim },

  list:       { paddingHorizontal: Spacing.screen, gap: 10 },
  pendingCard:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: Colors.border },
  childAvatarSm: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pendingTask:{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  pendingMeta:{ fontSize: 11, fontWeight: '600', color: Colors.textDim, marginTop: 2 },
  repBadge:     { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 2 },
  repBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)' },
  ptsBadge:   { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.18)', borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  ptsBadgeText: { fontSize: 12, fontWeight: '900', color: Colors.gold },
  btnApprove: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)', alignItems: 'center', justifyContent: 'center' },
  btnReject:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,83,80,0.1)',  borderWidth: 1, borderColor: 'rgba(239,83,80,0.2)',  alignItems: 'center', justifyContent: 'center' },
  grantBtn:   { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  grantBtnText: { fontSize: 13, fontWeight: '900', color: '#1a1000' },
  emptyPending:  { alignItems: 'center', padding: 32, gap: 8 },
  emptyText:     { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  emptySubText:  { fontSize: 13, fontWeight: '600', color: Colors.textFaint, textAlign: 'center', lineHeight: 18 },
  emptyCTA:      { marginTop: 8, backgroundColor: Colors.gold, borderRadius: Radii.md, paddingHorizontal: 24, paddingVertical: 12 },
  emptyCTAText:  { fontSize: 14, fontWeight: '900', color: '#1a1000' },
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
