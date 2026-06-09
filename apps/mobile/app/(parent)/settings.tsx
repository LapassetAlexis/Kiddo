import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Share,
  Modal, Pressable, TextInput, Animated,
} from 'react-native';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionsApi } from '@/lib/api/transactions';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext';
import { childrenApi } from '@/lib/api/children';
import { familiesApi } from '@/lib/api/families';
import { formatName } from '@/lib/formatName';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import * as Clipboard from 'expo-clipboard';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';
import { api } from '@/lib/api-client';

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      await api.post('/feedback', { category: contactCategory, message: contactMessage.trim() });
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

  const THEME_OPTIONS: { key: ThemePreference; emoji: string; label: string }[] = [
    { key: 'light',  emoji: '☀️', label: 'Clair' },
    { key: 'dark',   emoji: '🌙', label: 'Sombre' },
    { key: 'system', emoji: '📱', label: 'Auto' },
  ];

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
                            <Text style={[styles.inviteBtnText, { color: colors.textDim }]}>Copier le code</Text>
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

        {/* Apparence */}
        <Text style={styles.sectionLabel}>Apparence</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.themeChip, preference === t.key && styles.themeChipActive]}
                onPress={() => setPreference(t.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.themeChipEmoji}>{t.emoji}</Text>
                <Text style={[styles.themeChipLabel, preference === t.key && styles.themeChipLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            <Text style={[styles.linkText, { color: colors.gold }]}>🔄 Réinitialiser le tour guidé</Text>
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

              {/* Header */}
              <View style={[styles.contactHeader, { marginTop: 8, marginBottom: 20 }]}>
                <View style={styles.contactIconWrap}>
                  <Text style={{ fontSize: 18 }}>✉️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>Nous contacter</Text>
                  <Text style={styles.contactSub}>On lit chaque message — promis !</Text>
                </View>
              </View>

              {/* Category chips */}
              <View style={[styles.chipRow, { marginBottom: 20 }]}>
                {([
                  { key: 'bug', emoji: '🐛', label: 'Bug' },
                  { key: 'question', emoji: '❓', label: 'Question' },
                  { key: 'feature', emoji: '💡', label: 'Suggestion' },
                ] as const).map(c => {
                  const active = contactCategory === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setContactCategory(c.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipEmoji}>{c.emoji}</Text>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message input */}
              <View style={[styles.contactInputWrap, { marginBottom: 20 }]}>
                <TextInput
                  style={styles.contactInput}
                  placeholder="Décris ton problème ou ton idée..."
                  placeholderTextColor={colors.textFaint}
                  value={contactMessage}
                  onChangeText={setContactMessage}
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                />
                <Text style={styles.contactCounter}>{contactMessage.length} / 2000</Text>
              </View>

              <TouchableOpacity
                style={[styles.contactBtn, (contactSending || contactMessage.trim().length < 10) && styles.contactBtnDisabled]}
                onPress={sendContact}
                disabled={contactSending || contactMessage.trim().length < 10}
                activeOpacity={0.85}
              >
                <Text style={styles.contactBtnText}>{contactSending ? 'Envoi en cours…' : 'Envoyer le message'}</Text>
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
  const { colors } = useTheme();
  return (
    <View style={[toggleRowStyle.row, disabled && { opacity: 0.6 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[toggleRowStyle.label, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[toggleRowStyle.desc, { color: colors.textFaint }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: 'rgba(255,184,0,0.4)' }}
        thumbColor={value ? colors.gold : colors.textDim}
      />
    </View>
  );
}

const toggleRowStyle = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  label: { fontSize: 14, fontWeight: '800' },
  desc:  { fontSize: 12, fontWeight: '600', marginTop: 2 },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={infoRowStyle.row}>
      <Text style={[infoRowStyle.label, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[infoRowStyle.value, { color: colors.textFaint }]}>{value}</Text>
    </View>
  );
}

const infoRowStyle = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  label: { fontSize: 14, fontWeight: '700' },
  value: { fontSize: 13, fontWeight: '700' },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  header: {
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },

  content: { padding: Spacing.screen, gap: 10 },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 8, marginBottom: 4,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },

  rowDivider: { height: 1, backgroundColor: colors.border },

  profileRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  profileAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText:{ fontSize: 24, fontWeight: '900', color: colors.gold },
  profileName:      { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  profileEmail:     { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2 },

  editBtn:     { backgroundColor: colors.bgScreen, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  editBtnText: { fontSize: 12, fontWeight: '800', color: colors.textDim },

  childRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  childAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  childName:   { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  childMeta:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  childLevelEmoji: { fontSize: 13 },
  childLevelBadge: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  childLevelText:  { fontSize: 10, fontWeight: '900', color: '#a78bfa' },
  childPts:    { fontSize: 12, fontWeight: '700', color: colors.gold, marginTop: 2 },
  addChildRow: { padding: 16, alignItems: 'center' },
  addChildText:{ fontSize: 14, fontWeight: '800', color: colors.textDim },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.textFaint },

  linkRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  linkText:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  linkArrow: { fontSize: 20, color: colors.textFaint, fontWeight: '300' },

  parentsBlock:     { padding: 16, gap: 10 },
  parentsTitle:     { fontSize: 12, fontWeight: '800', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  parentDivider:    { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  parentRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  parentAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  parentAvatarText: { fontSize: 24, fontWeight: '900', color: colors.gold },
  parentName:       { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  parentEmail:      { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2 },
  selfBadge:        { backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  selfBadgeText:    { fontSize: 10, fontWeight: '900', color: colors.gold },

  inviteBlock:      { padding: 16, gap: 10 },
  inviteTitle:      { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  inviteDesc:       { fontSize: 12, fontWeight: '600', color: colors.textFaint, lineHeight: 18 },
  codeBox:          { backgroundColor: 'rgba(255,184,0,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', paddingVertical: 14, alignItems: 'center' },
  codeText:         { fontSize: 28, fontWeight: '900', color: colors.gold, letterSpacing: 6 },
  inviteBtns:       { flexDirection: 'row', gap: 8 },
  inviteBtn:        { flex: 1, backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  inviteBtnSecondary: { backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  inviteBtnText:    { fontSize: 13, fontWeight: '900', color: '#1a1000' },
  regenerateBtn:    { alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  regenerateBtnText:{ fontSize: 12, fontWeight: '700', color: colors.textFaint },

  themeRow:          { flexDirection: 'row', padding: 14, gap: 8 },
  themeChip:         { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  themeChipActive:   { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.4)' },
  themeChipEmoji:    { fontSize: 20 },
  themeChipLabel:    { fontSize: 12, fontWeight: '800', color: colors.textDim },
  themeChipLabelActive: { color: colors.gold },

  contactOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  contactSheet:     { backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 40, gap: 24, borderTopWidth: 1, borderColor: colors.border },
  contactHandle:    { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  contactHeader:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  contactIconWrap:  { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  contactTitle:     { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  contactSub:       { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2 },
  chipRow:          { flexDirection: 'row', gap: 8 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  chipActive:       { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.4)' },
  chipEmoji:        { fontSize: 14 },
  chipText:         { fontSize: 12, fontWeight: '800', color: colors.textDim },
  chipTextActive:   { color: colors.gold },
  contactInputWrap: { backgroundColor: colors.bgScreen, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  contactInput:     { color: colors.textPrimary, fontSize: 14, fontWeight: '500', minHeight: 100, lineHeight: 20 },
  contactCounter:   { fontSize: 10, fontWeight: '700', color: colors.textFaint, textAlign: 'right' },
  contactBtn:       { backgroundColor: colors.gold, borderRadius: Radii.pill, paddingVertical: 15, alignItems: 'center', marginTop: 2 },
  contactBtnDisabled: { backgroundColor: 'rgba(255,184,0,0.25)' },
  contactBtnText:   { fontSize: 15, fontWeight: '900', color: '#1a1000' },
});
