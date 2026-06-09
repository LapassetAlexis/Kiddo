import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Share,
  Modal, Pressable, TextInput, Animated,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionsApi } from '@/lib/api/transactions';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { useAuth } from '@/contexts/AuthContext';
import { childrenApi } from '@/lib/api/children';
import { familiesApi } from '@/lib/api/families';
import { formatName } from '@/lib/formatName';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import * as Clipboard from 'expo-clipboard';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';
import { apiCall } from '@/lib/api-client';

export default function SettingsScreen() {
  const [notifTask,      setNotifTask]      = useState(true);
  const [notifReward,    setNotifReward]    = useState(true);
  const [notifStreak,    setNotifStreak]    = useState(false);
  const [savingNotif,    setSavingNotif]    = useState(false);
  const [childBalances,  setChildBalances]  = useState<Record<string, number>>({});
  const [contactVisible,  setContactVisible]  = useState(false);
  const [contactCategory, setContactCategory] = useState<'bug' | 'question' | 'feature'>('bug');
  const [contactMessage,  setContactMessage]  = useState('');
  const [contactSending,  setContactSending]  = useState(false);
  const contactSlide = useRef(new Animated.Value(400)).current;
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();
  const { logout, user } = useAuth();

  const scrollRef  = useRef<ScrollView>(null);
  const inviteRef = useRef<any>(null);
  const notifRef  = useRef<any>(null);
  const { active: tourActive, finish: finishTour } = useTour('settings');
  const [tourVisible, setTourVisible] = useState(false);

  useEffect(() => {
    if (tourActive) {
      const t = setTimeout(() => {
        if (scrollRef.current && inviteRef.current) {
          inviteRef.current.measureLayout(
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
  }, [tourActive]);

  const TOUR_STEPS: TourStep[] = [
    {
      ref: inviteRef,
      title: 'Code famille 🏠',
      body: 'Partage ce code pour inviter un autre gardien — il aura les mêmes droits que toi.',
    },
    {
      ref: notifRef,
      title: 'Notifications 🔔',
      body: 'Personnalise les alertes : quêtes soumises, récompenses réclamées, série en danger.',
    },
  ];

  const { data: profileData, refresh: profileRefresh } = useApiData(() => familiesApi.getMe(), []);
  const { data: parentsData, refresh: parentsRefresh } = useApiData(() => familiesApi.listParents(), []);
  const { data: childrenData, loading: childrenLoading, error: childrenError, refresh: childrenRefresh } =
    useApiData(() => childrenApi.list(), []);

  useFocusEffect(
    useCallback(() => {
      profileRefresh();
      parentsRefresh();
      childrenRefresh();
    }, [])
  );

  useEffect(() => {
    if (profileData) {
      setNotifTask(profileData.notifTaskSubmitted ?? true);
      setNotifReward(profileData.notifRewardClaimed ?? true);
      setNotifStreak(profileData.notifStreakAlert ?? false);
    }
  }, [profileData]);

  useEffect(() => {
    if (!childrenData?.length) return;
    Promise.all(
      childrenData.map(c =>
        transactionsApi.getBalance(c.id)
          .then(b => [c.id, b.balance] as const)
          .catch(() => [c.id, 0] as const)
      )
    ).then(entries => setChildBalances(Object.fromEntries(entries)));
  }, [childrenData]);

  async function saveNotifPref(field: 'notifTaskSubmitted' | 'notifRewardClaimed' | 'notifStreakAlert', value: boolean) {
    setSavingNotif(true);
    try { await familiesApi.updateNotifPrefs({ [field]: value }); } catch {}
    setSavingNotif(false);
  }

  async function regenerateCode() {
    showModal({
      icon: '🔑',
      title: 'Nouveau code famille ?',
      message: 'L\'ancien code ne fonctionnera plus. Les autres gardiens ne sont pas affectés.',
      buttons: [
        { label: 'Générer', style: 'destructive', onPress: async () => {
          try {
            await familiesApi.regenerateInviteCode();
            profileRefresh();
          } catch {
            showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de régénérer le code.', buttons: [{ label: 'OK', style: 'default' }] });
          }
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  function confirmLogout() {
    showModal({
      icon: '🚪',
      title: 'Se déconnecter ?',
      message: 'Tu devras te reconnecter avec ton email et ton mot de passe.',
      buttons: [
        { label: 'Se déconnecter', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  function openContact() {
    setContactVisible(true);
    Animated.spring(contactSlide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  }
  function closeContact() {
    Animated.timing(contactSlide, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
      setContactVisible(false);
      setContactMessage('');
      setContactCategory('bug');
    });
  }

  async function sendContact() {
    if (contactMessage.trim().length < 10) {
      showModal({ icon: '⚠️', title: 'Message trop court', message: 'Décris ton message en au moins 10 caractères.' });
      return;
    }
    setContactSending(true);
    try {
      await apiCall('POST', '/feedback', { category: contactCategory, message: contactMessage.trim() });
      closeContact();
      setTimeout(() => showModal({ icon: '✅', title: 'Message envoyé !', message: 'Nous reviendrons vers toi dès que possible.' }), 300);
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: "Impossible d'envoyer le message. Réessaie plus tard." });
    } finally {
      setContactSending(false);
    }
  }

  function confirmDeleteAccount() {
    showModal({
      icon: '⚠️',
      title: 'Supprimer le compte ?',
      message: 'Toutes les données (enfants, quêtes, récompenses, pièces) seront définitivement supprimées. Cette action est irréversible.',
      buttons: [
        { label: 'Supprimer définitivement', style: 'destructive', onPress: () => {
          showModal({ icon: '✅', title: 'Compte supprimé', message: 'Toutes tes données ont été effacées.', buttons: [{ label: 'OK', style: 'default', onPress: () => router.replace('/(auth)/login') }] });
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  if (childrenLoading && !childrenData) return <LoadingScreen />;
  if (childrenError && !childrenData) return <ErrorScreen message={childrenError} onRetry={childrenRefresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres ⚙️</Text>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profil parent */}
        <Text style={styles.sectionLabel}>Mon profil</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{(formatName(profileData?.name, profileData?.email) || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{formatName(profileData?.name, profileData?.email) || 'Mon profil'}</Text>
              <Text style={styles.profileEmail}>{profileData?.email ?? ''}</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(parent)/edit-profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enfants */}
        <Text style={styles.sectionLabel}>Mes enfants</Text>
        <View style={styles.card}>
          {(childrenData ?? []).map((child, i) => (
            <View key={child.id}>
              {i > 0 && <View style={styles.rowDivider} />}
              <View style={styles.childRow}>
                <View style={styles.childAvatar}>
                  <Text style={{ fontSize: 22 }}>{child.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <View style={styles.childMeta}>
                    <Text style={styles.childLevelEmoji}>{child.levelEmoji}</Text>
                    <View style={styles.childLevelBadge}>
                      <Text style={styles.childLevelText}>Niv. {child.level}</Text>
                    </View>
                    <Text style={styles.childPts}>· 🪙 {childBalances[child.id] ?? 0}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: '/(parent)/edit-child', params: { childId: child.id, childName: child.name, childEmoji: child.avatar } })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.addChildRow}
            onPress={() => router.push('/(parent)/create-child')}
            activeOpacity={0.7}
          >
            <Text style={styles.addChildText}>＋  Ajouter un enfant</Text>
          </TouchableOpacity>
        </View>

        {/* Parents */}
        <Text style={styles.sectionLabel}>Gardiens</Text>
        <View style={styles.card}>
          {(parentsData ?? []).map((parent, i) => {
            const isSelf = parent.id === user?.id;
            const displayName = formatName(parent.name, parent.email);
            return (
              <View key={parent.id}>
                {i > 0 && <View style={styles.rowDivider} />}
                <View style={styles.parentRow}>
                  <View style={styles.parentAvatar}>
                    <Text style={styles.parentAvatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.parentName}>{displayName}</Text>
                      {isSelf && (
                        <View style={styles.selfBadge}>
                          <Text style={styles.selfBadgeText}>Toi</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.parentEmail}>{parent.email}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Invitation */}
        <Text style={styles.sectionLabel}>Invitation</Text>
        <View style={styles.card}>
          <View ref={inviteRef} collapsable={false} style={styles.inviteBlock}>
            <Text style={styles.inviteTitle}>Inviter un gardien</Text>
            <Text style={styles.inviteDesc}>Partage ce code pour qu'un autre gardien rejoigne ta famille avec les mêmes droits.</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{profileData?.inviteCode ?? '——————'}</Text>
            </View>
            <View style={styles.inviteBtns}>
                          <TouchableOpacity
                            style={styles.inviteBtn}
                            activeOpacity={0.7}
                            onPress={() => Share.share({ message: `Code famille Kiddo : ${profileData?.inviteCode}` })}
                          >
                            <Text style={styles.inviteBtnText}>Partager le code</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.inviteBtn, styles.inviteBtnSecondary]}
                            activeOpacity={0.7}
                            onPress={async () => {
                              await Clipboard.setStringAsync(profileData?.inviteCode ?? '');
                              showModal({ icon: '✅', title: 'Code copié !', message: `Le code ${profileData?.inviteCode} a été copié dans le presse-papier.`, buttons: [{ label: 'OK', style: 'default' }] });
                            }}
                          >
                            <Text style={[styles.inviteBtnText, { color: Colors.textDim }]}>Copier le code</Text>
                          </TouchableOpacity>
                        </View>
            <TouchableOpacity
              style={styles.regenerateBtn}
              activeOpacity={0.7}
              onPress={regenerateCode}
            >
              <Text style={styles.regenerateBtnText}>🔄  Générer un nouveau code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View ref={notifRef} collapsable={false} style={styles.card}>
          <ToggleRow
            label="Quête soumise"
            desc="Quand un enfant marque une quête comme faite"
            value={notifTask}
            onToggle={v => { setNotifTask(v); saveNotifPref('notifTaskSubmitted', v); }}
            disabled={savingNotif}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            label="Récompense réclamée"
            desc="Quand un enfant réclame une récompense"
            value={notifReward}
            onToggle={v => { setNotifReward(v); saveNotifPref('notifRewardClaimed', v); }}
            disabled={savingNotif}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            label="Série en danger 🔥"
            desc="Alerte si un enfant risque de perdre sa série en fin de journée"
            value={notifStreak}
            onToggle={v => { setNotifStreak(v); saveNotifPref('notifStreakAlert', v); }}
            disabled={savingNotif}
          />
        </View>

        {/* À propos */}
        <Text style={styles.sectionLabel}>À propos</Text>
        <View style={styles.card}>
          <InfoRow label="Version" value="0.1.0" />
          <View style={styles.rowDivider} />
          <InfoRow label="Environnement" value="Développement" />
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push({ pathname: '/(parent)/legal', params: { type: 'terms' } })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push({ pathname: '/(parent)/legal', params: { type: 'privacy' } })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.linkRow} onPress={openContact} activeOpacity={0.7}>
            <Text style={styles.linkText}>Nous contacter</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dev — TODO: supprimer avant prod */}
        <Text style={styles.sectionLabel}>Dev</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => AsyncStorage.multiRemove(['@kiddo:tour:dashboard', '@kiddo:tour:dashboard-validate', '@kiddo:tour:dashboard-child-login', '@kiddo:tour:tasks', '@kiddo:tour:manage', '@kiddo:tour:child-home', '@kiddo:tour:child-rewards', '@kiddo:onboarding:done', '@kiddo:tour:settings', '@kiddo:tour:edit-child']).then(() => alert("Tours et checklist réinitialisés — recharge le dashboard"))}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: Colors.gold }]}>🔄 Réinitialiser le tour guidé</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Compte */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={confirmLogout} activeOpacity={0.7}>
            <Text style={styles.linkText}>Se déconnecter</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.linkRow} onPress={confirmDeleteAccount} activeOpacity={0.7}>
            <Text style={[styles.linkText, { color: '#EF5350' }]}>Supprimer le compte</Text>
            <Text style={[styles.linkArrow, { color: '#EF5350' }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={contactVisible} transparent animationType="none" onRequestClose={closeContact}>
        <Pressable style={styles.contactOverlay} onPress={closeContact}>
          <Animated.View style={[styles.contactSheet, { transform: [{ translateY: contactSlide }] }]}>
            <Pressable>
              <View style={styles.contactHandle} />
              <Text style={styles.contactTitle}>Nous contacter</Text>
              <Text style={styles.contactSub}>Bug, question ou suggestion — on lit tout !</Text>

              {/* Category chips */}
              <View style={styles.chipRow}>
                {([
                  { key: 'bug', label: '🐛 Bug' },
                  { key: 'question', label: '❓ Question' },
                  { key: 'feature', label: '💡 Suggestion' },
                ] as const).map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, contactCategory === c.key && styles.chipActive]}
                    onPress={() => setContactCategory(c.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, contactCategory === c.key && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message input */}
              <TextInput
                style={styles.contactInput}
                placeholder="Décris ton problème ou ton idée..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={contactMessage}
                onChangeText={setContactMessage}
                multiline
                numberOfLines={5}
                maxLength={2000}
                textAlignVertical="top"
              />
              <Text style={styles.contactCounter}>{contactMessage.length}/2000</Text>

              <TouchableOpacity
                style={[styles.contactBtn, contactSending && { opacity: 0.5 }]}
                onPress={sendContact}
                disabled={contactSending}
                activeOpacity={0.85}
              >
                <Text style={styles.contactBtnText}>{contactSending ? 'Envoi…' : 'Envoyer'}</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <AppModal config={modalCfg} onHide={hideModal} />
      <SpotlightTour
        steps={TOUR_STEPS}
        visible={tourVisible}
        onFinish={() => { setTourVisible(false); finishTour(); }}
      />
    </SafeAreaView>
  );
}

function ToggleRow({ label, desc, value, onToggle, disabled }: {
  label: string; desc: string; value: boolean; onToggle: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.6 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,184,0,0.4)' }}
        thumbColor={value ? Colors.gold : 'rgba(255,255,255,0.4)'}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },

  header: {
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },

  content: { padding: Spacing.screen, gap: 10 },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 8, marginBottom: 4,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },

  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  profileRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  profileAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText:{ fontSize: 24, fontWeight: '900', color: Colors.gold },
  profileName:      { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  profileEmail:     { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  editBtn:     { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontSize: 12, fontWeight: '800', color: Colors.textDim },

  childRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  childAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  childName:   { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  childMeta:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  childLevelEmoji: { fontSize: 13 },
  childLevelBadge: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  childLevelText:  { fontSize: 10, fontWeight: '900', color: '#a78bfa' },
  childPts:    { fontSize: 12, fontWeight: '700', color: Colors.gold, marginTop: 2 },
  addChildRow: { padding: 16, alignItems: 'center' },
  addChildText:{ fontSize: 14, fontWeight: '800', color: Colors.textDim },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  toggleDesc:  { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.textFaint },

  linkRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  linkText:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  linkArrow: { fontSize: 20, color: Colors.textFaint, fontWeight: '300' },

  parentsBlock:     { padding: 16, gap: 10 },
  parentsTitle:     { fontSize: 12, fontWeight: '800', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  parentDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 4 },
  parentRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  parentAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  parentAvatarText: { fontSize: 24, fontWeight: '900', color: Colors.gold },
  parentName:       { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  parentEmail:      { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },
  selfBadge:        { backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  selfBadgeText:    { fontSize: 10, fontWeight: '900', color: Colors.gold },

  inviteBlock:      { padding: 16, gap: 10 },
  inviteTitle:      { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  inviteDesc:       { fontSize: 12, fontWeight: '600', color: Colors.textFaint, lineHeight: 18 },
  codeBox:          { backgroundColor: 'rgba(255,184,0,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', paddingVertical: 14, alignItems: 'center' },
  codeText:         { fontSize: 28, fontWeight: '900', color: Colors.gold, letterSpacing: 6 },
  inviteBtns:       { flexDirection: 'row', gap: 8 },
  inviteBtn:        { flex: 1, backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  inviteBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border },
  inviteBtnText:    { fontSize: 13, fontWeight: '900', color: '#1a1000' },
  regenerateBtn:    { alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 4 },
  regenerateBtnText:{ fontSize: 12, fontWeight: '700', color: Colors.textFaint },

  contactOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  contactSheet:     { backgroundColor: '#1e1e26', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  contactHandle:    { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  contactTitle:     { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  contactSub:       { fontSize: 13, fontWeight: '600', color: Colors.textFaint, marginTop: -8 },
  chipRow:          { flexDirection: 'row', gap: 8 },
  chip:             { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive:       { backgroundColor: 'rgba(255,184,0,0.15)', borderColor: 'rgba(255,184,0,0.5)' },
  chipText:         { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  chipTextActive:   { color: Colors.gold },
  contactInput:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, color: Colors.textPrimary, fontSize: 14, fontWeight: '600', minHeight: 120 },
  contactCounter:   { fontSize: 11, color: Colors.textFaint, textAlign: 'right', marginTop: -8 },
  contactBtn:       { backgroundColor: Colors.gold, borderRadius: Radii.pill, paddingVertical: 14, alignItems: 'center' },
  contactBtnText:   { fontSize: 15, fontWeight: '900', color: '#1a1000' },
});
