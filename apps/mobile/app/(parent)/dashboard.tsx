import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Animated, Pressable, Image } from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii, Spacing, Fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';
import OnboardingChecklist from '@/components/ui/OnboardingChecklist';

type PendingTask = { id: string; childName: string; childEmoji: string; childColor: string; taskName: string; goldReward: number; ago: string; note?: string; photoUrl?: string; timesPerDay: number; completedToday: number; bonusGold: number; };
type RewardRequest = { id: string; childName: string; childEmoji: string; rewardName: string; emoji: string; pts: number; };

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screen, paddingTop: 12 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo:    { width: 32, height: 32, borderRadius: 8 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sub:           { fontFamily: Fonts.pixel, fontSize: 15, color: colors.textDim },
  title:         { fontFamily: Fonts.pixelBold, fontSize: 15, color: colors.textPrimary },
  addBtn:        { width: 44, height: 44, backgroundColor: colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText:    { fontFamily: Fonts.pixelBold, fontSize: 16, color: '#1a1000', lineHeight: 28 },
  exceptBtn:     { width: 44, height: 44, backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  exceptBtnText: { fontSize: 22 },

  fieldLabel:    { fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  exceptInput:   { backgroundColor: colors.bgScreen, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 13, fontSize: 14, color: colors.textPrimary, marginBottom: 14 },
  childChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgScreen, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  childChipActive: { borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  childChipText: { fontSize: 13, color: colors.textDim },
  goldChip:      { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: colors.bgScreen, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  goldChipActive:{ borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  goldChipText:  { fontSize: 14, color: colors.textDim },
  diffRow:       { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.bgScreen, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  diffRowActive: { borderColor: 'rgba(255,184,0,0.5)', backgroundColor: 'rgba(255,184,0,0.08)' },
  diffText:      { fontSize: 13, color: colors.textDim },
  confirmBtn:    { backgroundColor: colors.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
  confirmBtnText:{ fontFamily: Fonts.pixelBold, fontSize: 11, color: '#1a1000' },

  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.screen, marginBottom: 14, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.22)', borderRadius: 16, padding: 12 },
  urgentCount:  { fontFamily: Fonts.pixelBold, fontSize: 11, color: colors.orange },
  urgentSub:    { fontSize: 11, color: 'rgba(255,107,53,0.6)', marginTop: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.screen, marginBottom: 10 },
  sectionTitle:  { fontFamily: Fonts.pixel, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },
  pendingCount:  { fontSize: 12, color: colors.orange },
  todoCount:     { fontSize: 12, color: colors.textDim },
  todoCard:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: colors.border },
  todoCardRejected: { borderColor: 'rgba(239,83,80,0.25)', backgroundColor: 'rgba(239,83,80,0.05)' },
  todoRejectedLabel:{ fontSize: 11, color: 'rgba(239,83,80,0.8)', marginTop: 2 },

  childScroll: { paddingHorizontal: Spacing.screen, gap: 12, paddingBottom: 4 },
  childCard:   { backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, width: 150, minHeight: 160, gap: 8, marginBottom: 16, position: 'relative' },
  childCardAlert: { borderColor: 'rgba(255,184,0,0.2)' },
  childAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 6 },
  childName:  { fontFamily: Fonts.pixel, fontSize: 17, color: colors.textPrimary },
  childLevelRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  childLevelEmoji:     { fontSize: 14 },
  childLevelBadge:     { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  childLevelBadgeText: { fontSize: 10, color: '#a78bfa' },
  childPts:   { fontFamily: Fonts.pixel, fontSize: 15, color: colors.gold },
  addChildCard: { backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', width: 150, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.5 },
  addChildText: { fontSize: 13, color: colors.textDim },

  list:       { paddingHorizontal: Spacing.screen, gap: 10 },
  pendingCard:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: Radii.card, padding: 14, borderWidth: 1, borderColor: colors.border },
  childAvatarSm: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pendingTask:{ fontFamily: Fonts.pixel, fontSize: 16, color: colors.textPrimary },
  pendingMeta:{ fontSize: 11, color: colors.textDim, marginTop: 2 },
  repBadge:     { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 2 },
  repBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  ptsBadge:   { backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.18)', borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  ptsBadgeText: { fontSize: 12, color: colors.gold },
  btnApprove: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)', alignItems: 'center', justifyContent: 'center' },
  btnReject:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,83,80,0.1)',  borderWidth: 1, borderColor: 'rgba(239,83,80,0.2)',  alignItems: 'center', justifyContent: 'center' },
  grantBtn:   { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  grantBtnText: { fontSize: 13, color: '#1a1000' },
  emptyPending:  { alignItems: 'center', padding: 32, gap: 8 },
  emptyText:     { fontSize: 15, color: colors.textDim },
  emptySubText:  { fontSize: 13, color: colors.textFaint, textAlign: 'center', lineHeight: 18 },
  emptyCTA:      { marginTop: 8, backgroundColor: colors.gold, borderRadius: Radii.md, paddingHorizontal: 24, paddingVertical: 12 },
  emptyCTAText:  { fontSize: 14, color: '#1a1000' },
  // Review modal
  reviewSheet: {
    backgroundColor: '#1e1e26', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 16,
  },
  reviewHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewTaskName: { fontSize: 16, color: colors.textPrimary },
  reviewMeta:     { fontSize: 12, color: colors.textDim, marginTop: 2 },
  reviewNote: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14,
  },
  reviewNoteLabel: { fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  reviewNoteText:  { fontSize: 15, color: colors.textPrimary, fontStyle: 'italic' },
  reviewPhoto:     { width: '100%', height: 200, borderRadius: 16 },
  reviewActions:   { flexDirection: 'row', gap: 12 },
  btnRejectLg:     { flex: 1, backgroundColor: 'rgba(239,83,80,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,83,80,0.25)', padding: 16, alignItems: 'center' },
  btnRejectLgText: { fontSize: 15, color: '#EF5350' },
  btnApproveLg:    { flex: 1, backgroundColor: colors.green, borderRadius: 16, padding: 16, alignItems: 'center' },
  btnApproveLgText:{ fontSize: 15, color: '#fff' },

  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle:  { fontSize: 18, color: colors.textPrimary },

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
  modalTitle: { fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  modalSub:   { fontSize: 13, color: colors.textDim, marginBottom: 20 },

  modalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.orange,
    borderRadius: 18, padding: 18, marginBottom: 12,
  },
  modalBtnIcon:  { fontSize: 26 },
  modalBtnText:  { flex: 1 },
  modalBtnLabel: { fontSize: 16, color: '#fff' },
  modalBtnDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  modalBtnArrow: { fontSize: 22, color: 'rgba(255,255,255,0.5)' },

  modalCancel: {
    alignItems: 'center', padding: 16,
    backgroundColor: colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, marginTop: 4,
  },
  modalCancelText: { fontSize: 15, color: colors.textDim },
});

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
  const scrollRef        = useRef<ScrollView>(null);
  const addBtnRef        = useRef<any>(null);
  const exceptBtnRef     = useRef<any>(null);
  const pendingSecRef    = useRef<any>(null);
  const firstPendingRef  = useRef<any>(null);
  const firstChildRef    = useRef<any>(null);

  const { active: tourActive,         finish: finishTour }         = useTour('dashboard');
  const { active: validateTourActive, finish: finishValidateTour } = useTour('dashboard-validate');
  const { active: childLoginActive,   finish: finishChildLogin }   = useTour('dashboard-child-login');

  const [tourVisible,        setTourVisible]        = useState(false);
  const [validateTourVisible, setValidateTourVisible] = useState(false);
  const [childLoginVisible,  setChildLoginVisible]  = useState(false);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  useEffect(() => {
    if (tourActive && !childrenLoading) {
      const t = setTimeout(() => setTourVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, [tourActive, childrenLoading]);

  useEffect(() => {
    if (validateTourActive && !tourActive && !tourVisible && (pendingData ?? []).length > 0) {
      const t = setTimeout(() => {
        if (scrollRef.current && firstPendingRef.current) {
          firstPendingRef.current.measureLayout(
            scrollRef.current,
            (_x: number, y: number) => {
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
              setTimeout(() => setValidateTourVisible(true), 450);
            },
            () => setValidateTourVisible(true),
          );
        } else {
          setValidateTourVisible(true);
        }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [validateTourActive, tourActive, tourVisible, pendingData]);

  useEffect(() => {
    if (childLoginActive && !tourActive && !tourVisible && !validateTourActive && !validateTourVisible && (childrenData ?? []).length > 0 && !childrenLoading) {
      const t = setTimeout(() => {
        if (scrollRef.current && firstChildRef.current) {
          firstChildRef.current.measureLayout(
            scrollRef.current,
            (_x: number, y: number) => {
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
              setTimeout(() => setChildLoginVisible(true), 450);
            },
            () => setChildLoginVisible(true),
          );
        } else {
          setChildLoginVisible(true);
        }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [childLoginActive, tourActive, tourVisible, validateTourActive, validateTourVisible, childrenLoading, (childrenData ?? []).length]);

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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <PixelText style={styles.sub}>Bonjour,</PixelText>
              <PixelText style={styles.title}>{parentName} 👋</PixelText>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View ref={exceptBtnRef} collapsable={false}>
              <TouchableOpacity
                style={styles.exceptBtn}
                onPress={() => { setExceptChildId((childrenData ?? [])[0]?.id ?? ''); setExceptModal(true); }}
                activeOpacity={0.8}
              >
                <PixelText style={styles.exceptBtnText}>⚡</PixelText>
              </TouchableOpacity>
            </View>
            <View ref={addBtnRef} collapsable={false}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <PixelText style={styles.addBtnText}>+</PixelText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Urgent banner */}
        {pending.length > 0 && (
          <View style={styles.urgentBanner}>
            <PixelText style={{ fontSize: 20 }}>⚡</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText style={styles.urgentCount}>{pending.length} quête{pending.length > 1 ? 's' : ''} à valider</PixelText>
              <PixelText style={styles.urgentSub}>{pending.map(p => p.childName).join(' et ')} attendent</PixelText>
            </View>
          </View>
        )}

        {/* Onboarding checklist */}
        <OnboardingChecklist childrenCount={(childrenData ?? []).length} />

        {/* Children */}
        <View style={styles.sectionHeader}>
          <PixelText style={styles.sectionTitle}>MES ENFANTS</PixelText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childScroll}>
          {(childrenData ?? []).map((child, i) => (
            <View key={child.id} ref={i === 0 ? firstChildRef : undefined} collapsable={false}>
            <TouchableOpacity
              style={[styles.childCard, styles.childCardAlert]}
              onPress={() => router.push({ pathname: '/(auth)/child-pin', params: { name: child.name, childId: child.id, fromParent: 'true' } })}
              activeOpacity={0.8}
            >
              <View style={[styles.childAvatar, { backgroundColor: child.color ?? '#FFB300', shadowColor: child.color ?? '#FFB300' }]}>
                <PixelText style={{ fontSize: 26 }}>{child.avatar}</PixelText>
              </View>
              <PixelText style={styles.childName}>{child.name}</PixelText>
              <View style={styles.childLevelRow}>
                <PixelText style={styles.childLevelEmoji}>{child.levelEmoji}</PixelText>
                <View style={styles.childLevelBadge}>
                  <PixelText style={styles.childLevelBadgeText}>Niv. {child.level}</PixelText>
                </View>
              </View>
              <PixelText style={styles.childPts}>🪙 {balances[child.id] ?? 0}</PixelText>
            </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addChildCard}
            onPress={() => router.push('/(parent)/create-child')}
            activeOpacity={0.7}
          >
            <PixelText style={{ fontSize: 28, color: colors.textFaint }}>＋</PixelText>
            <PixelText style={styles.addChildText}>Ajouter</PixelText>
          </TouchableOpacity>
        </ScrollView>

        {/* Quêtes en cours */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <PixelText style={styles.sectionTitle}>TÂCHES EN COURS</PixelText>
          {(todoData ?? []).length > 0 && <PixelText style={styles.todoCount}>{(todoData ?? []).length}</PixelText>}
        </View>

        {todoLoading && !todoData ? (
          <View style={styles.emptyPending}>
            <PixelText style={styles.emptyText}>Chargement…</PixelText>
          </View>
        ) : (todoData ?? []).length === 0 ? (
          <View style={styles.emptyPending}>
            <PixelText style={{ fontSize: 28, marginBottom: 6 }}>📋</PixelText>
            <PixelText style={styles.emptyText}>Aucune quête active</PixelText>
            <PixelText style={styles.emptySubText}>Crée des tâches pour que tes héros puissent gagner de l'XP !</PixelText>
            <TouchableOpacity style={styles.emptyCTA} onPress={() => goTo('/(parent)/create-task')} activeOpacity={0.8}>
              <PixelText style={styles.emptyCTAText}>+ Créer une quête</PixelText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {(todoData ?? []).map(task => {
              const wasRejected = task.rejectionReason != null;
              return (
                <View key={task.id} style={[styles.todoCard, wasRejected && styles.todoCardRejected]}>
                  <View style={[styles.childAvatarSm, { backgroundColor: task.child.color ?? '#FFB300' }]}>
                    <PixelText style={{ fontSize: 18 }}>{task.child.avatar}</PixelText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <PixelText style={styles.pendingTask}>{task.title}</PixelText>
                    <PixelText style={styles.pendingMeta}>
                      {task.child.name}{task.frequency !== 'once' ? ` · ${task.frequency === 'daily' ? 'quotidien' : 'hebdo'}` : ''}
                    </PixelText>
                    {wasRejected && (
                      <PixelText style={styles.todoRejectedLabel}>
                        ↩ Rejeté{task.rejectionReason ? ` — ${task.rejectionReason}` : ''}
                      </PixelText>
                    )}
                  </View>
                  <View style={styles.ptsBadge}>
                    <PixelText style={styles.ptsBadgeText}>+{task.goldReward} 🪙</PixelText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Pending validations */}
        <View ref={pendingSecRef} style={[styles.sectionHeader, { marginTop: 28 }]}>
          <PixelText style={styles.sectionTitle}>À VALIDER</PixelText>
          {pending.length > 0 && <PixelText style={styles.pendingCount}>{pending.length}</PixelText>}
        </View>

        {pendingLoading && !pendingData ? (
          <View style={styles.emptyPending}>
            <PixelText style={styles.emptyText}>Chargement…</PixelText>
          </View>
        ) : pendingError && !pendingData ? (
          <View style={styles.emptyPending}>
            <PixelText style={styles.emptyText}>{pendingError}</PixelText>
          </View>
        ) : pending.length === 0 ? (
          <View style={styles.emptyPending}>
            <PixelText style={{ fontSize: 32, marginBottom: 8 }}>✅</PixelText>
            <PixelText style={styles.emptyText}>Tout est validé !</PixelText>
          </View>
        ) : (
          <View style={styles.list}>
            {pending.map((task, i) => (
              <View key={task.id} ref={i === 0 ? firstPendingRef : undefined} collapsable={false}>
              <TouchableOpacity style={styles.pendingCard} onPress={() => setReviewTask(task)} activeOpacity={0.8}>
                <View style={[styles.childAvatarSm, { backgroundColor: task.childColor }]}><PixelText style={{ fontSize: 18 }}>{task.childEmoji}</PixelText></View>
                <View style={{ flex: 1 }}>
                  <PixelText style={styles.pendingTask}>{task.taskName}</PixelText>
                  <PixelText style={styles.pendingMeta}>{task.childName} · {task.ago}{task.note ? ' · 💬' : ''}{task.photoUrl ? ' · 📷' : ''}</PixelText>
                </View>
                {task.timesPerDay > 1 && (
                  <View style={styles.repBadge}>
                    <PixelText style={styles.repBadgeText}>{task.completedToday + 1}/{task.timesPerDay}</PixelText>
                  </View>
                )}
                <View style={styles.ptsBadge}><PixelText style={styles.ptsBadgeText}>+{task.goldReward} 🪙</PixelText></View>
                <PixelText style={{ fontSize: 16, color: colors.textFaint }}>›</PixelText>
              </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reward requests */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <PixelText style={styles.sectionTitle}>RÉCOMPENSES RÉCLAMÉES</PixelText>
          {rewards.length > 0 && (
            <PixelText style={styles.pendingCount}>{rewards.length}</PixelText>
          )}
        </View>

        {rewardsLoading && !rewardsData ? (
          <View style={styles.emptyPending}>
            <PixelText style={styles.emptyText}>Chargement…</PixelText>
          </View>
        ) : rewardsError && !rewardsData ? (
          <View style={styles.emptyPending}>
            <PixelText style={styles.emptyText}>{rewardsError}</PixelText>
          </View>
        ) : rewards.length === 0 ? (
          <View style={styles.emptyPending}>
            <PixelText style={{ fontSize: 28, marginBottom: 6 }}>🎁</PixelText>
            <PixelText style={styles.emptyText}>Aucune récompense en attente</PixelText>
          </View>
        ) : (
          <View style={styles.list}>
            {rewards.map(r => (
              <View key={r.id} style={[styles.pendingCard, { borderColor: 'rgba(255,184,0,0.18)' }]}>
                <PixelText style={{ fontSize: 28 }}>{r.emoji}</PixelText>
                <View style={{ flex: 1 }}>
                  <PixelText style={styles.pendingTask}>{r.rewardName}</PixelText>
                  <PixelText style={styles.pendingMeta}>
                    {r.childEmoji} {r.childName} · {r.pts} 🪙 débités
                  </PixelText>
                </View>
                <TouchableOpacity style={styles.btnApprove} onPress={() => grantReward(r.id)} aria-label="Accorder">
                  <PixelText style={{ color: colors.green, fontSize: 17 }}>✓</PixelText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => refuseReward(r.id)} aria-label="Refuser">
                  <PixelText style={{ color: '#EF5350', fontSize: 17 }}>✕</PixelText>
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
            <PixelText style={styles.sheetTitle}>⚡ Quête exceptionnelle</PixelText>

            {/* Sélecteur enfant */}
            <PixelText style={styles.fieldLabel}>Enfant</PixelText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(childrenData ?? []).map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.childChip, exceptChildId === child.id && styles.childChipActive]}
                    onPress={() => setExceptChildId(child.id)}
                    activeOpacity={0.7}
                  >
                    <PixelText style={{ fontSize: 18 }}>{child.avatar}</PixelText>
                    <PixelText style={[styles.childChipText, exceptChildId === child.id && { color: colors.gold }]}>{child.name}</PixelText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Titre */}
            <PixelText style={styles.fieldLabel}>Ce qu'il/elle a fait</PixelText>
            <TextInput
              style={styles.exceptInput}
              placeholder="Ex : A aidé à ranger sans qu'on le demande"
              placeholderTextColor={colors.textFaint}
              value={exceptTitle}
              onChangeText={setExceptTitle}
              maxLength={80}
            />

            {/* Pièces */}
            <PixelText style={styles.fieldLabel}>Pièces d'or 🪙</PixelText>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {['10','20','30','50','100'].map(v => (
                <TouchableOpacity key={v} style={[styles.goldChip, exceptGold === v && styles.goldChipActive]} onPress={() => setExceptGold(v)} activeOpacity={0.7}>
                  <PixelText style={[styles.goldChipText, exceptGold === v && { color: colors.gold }]}>{v}</PixelText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulté */}
            <PixelText style={styles.fieldLabel}>Difficulté (XP)</PixelText>
            <View style={{ gap: 6, marginBottom: 20 }}>
              {DIFFS.map(d => (
                <TouchableOpacity key={d} style={[styles.diffRow, exceptDiff === d && styles.diffRowActive]} onPress={() => setExceptDiff(d)} activeOpacity={0.7}>
                  <PixelText style={[styles.diffText, exceptDiff === d && { color: colors.gold }]}>{XP_LABELS[d]}</PixelText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, (!exceptChildId || !exceptTitle.trim() || exceptLoading) && { opacity: 0.5 }]}
              onPress={sendExceptional}
              disabled={!exceptChildId || !exceptTitle.trim() || exceptLoading}
              activeOpacity={0.8}
            >
              <PixelText style={styles.confirmBtnText}>{exceptLoading ? 'Envoi…' : '⚡ Valider la quête'}</PixelText>
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
                  <View style={[styles.childAvatarSm, { backgroundColor: reviewTask.childColor }]}><PixelText style={{ fontSize: 22 }}>{reviewTask.childEmoji}</PixelText></View>
                  <View style={{ flex: 1 }}>
                    <PixelText style={styles.reviewTaskName}>{reviewTask.taskName}</PixelText>
                    <PixelText style={styles.reviewMeta}>{reviewTask.childName} · {reviewTask.ago}</PixelText>
                  </View>
                  <View style={styles.ptsBadge}><PixelText style={styles.ptsBadgeText}>+{reviewTask.goldReward} 🪙</PixelText></View>
                </View>

                {reviewTask.note ? (
                  <View style={styles.reviewNote}>
                    <PixelText style={styles.reviewNoteLabel}>Message de {reviewTask.childName}</PixelText>
                    <PixelText style={styles.reviewNoteText}>"{reviewTask.note}"</PixelText>
                  </View>
                ) : null}

                {reviewTask.photoUrl ? (
                  <Image source={{ uri: reviewTask.photoUrl }} style={styles.reviewPhoto} resizeMode="cover" />
                ) : null}

                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.btnRejectLg} onPress={() => confirmReject(reviewTask)} activeOpacity={0.8}>
                    <PixelText style={styles.btnRejectLgText}>✕  Rejeter</PixelText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnApproveLg} onPress={() => confirmApprove(reviewTask)} activeOpacity={0.8}>
                    <PixelText style={styles.btnApproveLgText}>✓  Valider</PixelText>
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

              <PixelText style={styles.modalTitle}>Ajouter</PixelText>
              <PixelText style={styles.modalSub}>Que veux-tu créer ?</PixelText>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => goTo('/(parent)/create-task')}
                activeOpacity={0.85}
              >
                <PixelText style={styles.modalBtnIcon}>📋</PixelText>
                <View style={styles.modalBtnText}>
                  <PixelText style={styles.modalBtnLabel}>Une quête</PixelText>
                  <PixelText style={styles.modalBtnDesc}>Assigne une mission à tes enfants</PixelText>
                </View>
                <PixelText style={styles.modalBtnArrow}>›</PixelText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => goTo('/(parent)/create-reward')}
                activeOpacity={0.85}
              >
                <PixelText style={styles.modalBtnIcon}>🎁</PixelText>
                <View style={styles.modalBtnText}>
                  <PixelText style={styles.modalBtnLabel}>Une récompense</PixelText>
                  <PixelText style={styles.modalBtnDesc}>Crée un cadeau à échanger contre des points</PixelText>
                </View>
                <PixelText style={styles.modalBtnArrow}>›</PixelText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancel} onPress={closeAddModal} activeOpacity={0.7}>
                <PixelText style={styles.modalCancelText}>Annuler</PixelText>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <SpotlightTour
        visible={tourVisible}
        onFinish={() => { setTourVisible(false); finishTour(); }}
        steps={[
          { ref: addBtnRef,    title: 'Créer quêtes et récompenses', body: 'Appuie sur + pour créer une nouvelle quête ou une récompense pour tes héros.' },
          { ref: exceptBtnRef, title: 'Quête exceptionnelle ⚡',       body: 'Récompense ton enfant sur-le-champ pour un effort remarquable, sans quête préalable.' },
        ] satisfies TourStep[]}
      />
      <SpotlightTour
        visible={validateTourVisible}
        onFinish={() => { setValidateTourVisible(false); finishValidateTour(); }}
        steps={[
          { ref: firstPendingRef, title: 'Valider les quêtes ✅', body: "Appuie sur cette carte pour approuver ou rejeter la quête de ton enfant !" },
        ] satisfies TourStep[]}
      />
      <SpotlightTour
        visible={childLoginVisible}
        onFinish={() => { setChildLoginVisible(false); finishChildLogin(); }}
        steps={[
          { ref: firstChildRef, title: "Espace enfant 👶", body: "Appuie sur le prénom d'un enfant pour te connecter à sa place et voir son aventure !" },
        ] satisfies TourStep[]}
      />
    </SafeAreaView>
  );
}
