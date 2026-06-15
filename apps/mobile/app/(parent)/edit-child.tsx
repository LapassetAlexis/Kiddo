import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { childrenApi } from '@/lib/api/children';
import { authApi } from '@/lib/api/auth';
import { useApiData } from '@/lib/useApiData';
import { CLASS_LABELS, CLASS_EMOJI } from '@/lib/rpg';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';
import { useTour } from '@/lib/useTour';
import type { ChildClass } from '@/lib/rpg';

const QR_TTL = 30;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { fontSize: 22, color: colors.textDim, width: 40 },
  navTitle:    { fontSize: 16, color: colors.textPrimary },
  saveBtn:     { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 12 },

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  avatarPreviewCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bigEmoji:      { fontSize: 52 },

  childNameDisplay: { fontSize: 20, color: colors.textPrimary },

  rpgCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    padding: 14,
  },
  rpgEmoji:      { fontSize: 34 },
  rpgInfo:       { flex: 1, gap: 4 },
  rpgTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rpgLevelBadge: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  rpgLevelText:  { fontSize: 11, color: '#a78bfa' },
  rpgTitle:      { fontSize: 14, color: colors.textPrimary },
  rpgClass:      { fontSize: 12, color: colors.textDim },

  sectionLabel: { fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4 },
  card:         { backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 16 },
  input:        { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  actionRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 16 },
  deleteRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(239,83,80,0.06)', borderRadius: Radii.card, borderWidth: 1, borderColor: 'rgba(239,83,80,0.18)', padding: 16 },
  actionIcon: { fontSize: 22 },
  actionText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  actionArrow:{ fontSize: 20, color: colors.textFaint },

  pinContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  pinTitle:   { fontSize: 18, color: colors.textPrimary, textAlign: 'center' },
  pinSub:     { fontSize: 13, color: colors.textDim, textAlign: 'center', marginTop: -8 },
  pinStep:    { fontSize: 14, color: colors.textDim },
  dots:       { flexDirection: 'row', gap: 16 },
  dot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.textFaint },
  dotFilled:  { backgroundColor: colors.gold, borderColor: colors.gold },
  numpad:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:        { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:   { width: 82, height: 82 },
  keyDelete:  { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, color: colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: colors.textDim },

  goalHint:        { fontSize: 12, color: colors.textFaint, marginBottom: 10 },
  goalRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  goalLevelInput:  { width: 56, fontSize: 16, fontWeight: '800', color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, textAlign: 'center', paddingBottom: 4 },
  goalRewardInput: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 },
  goalSaveBtn:     { backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' },
  goalSaveBtnText: { fontSize: 13, color: colors.gold },

  qrOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  qrSheet:       { backgroundColor: colors.bgCard, borderRadius: 28, padding: 28, alignItems: 'center', gap: 16, marginHorizontal: 24, width: 320 },
  qrTitle:       { fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  qrSub:         { fontSize: 13, color: colors.textDim, textAlign: 'center', marginTop: -8 },
  qrBox:         { backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  qrTimer:       { alignItems: 'center' },
  qrTimerText:   { fontSize: 14, color: colors.textDim },
  qrRefreshBtn:  { backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  qrRefreshText: { fontSize: 14, color: colors.gold },
  qrCloseBtn:    { paddingVertical: 8 },
  qrCloseBtnText:{ fontSize: 14, color: colors.textFaint },
});

export default function EditChildScreen() {
  const { childId, childName, childEmoji, childColor } = useLocalSearchParams<{
    childId: string; childName: string; childEmoji: string; childColor?: string;
  }>();

  const [name,           setName]           = useState(childName ?? '');
  const [pinMode,        setPinMode]        = useState(false);
  const [newPin,         setNewPin]         = useState('');
  const [confirm,        setConfirm]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [goalLevel,      setGoalLevel]      = useState<string>('');
  const [goalReward,     setGoalReward]     = useState<string>('');
  const [goalLoading,    setGoalLoading]    = useState(false);
  const [qrToken,   setQrToken]   = useState<string | null>(null);
  const [qrSeconds, setQrSeconds] = useState(QR_TTL);
  const [qrLoading, setQrLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef  = useRef<ScrollView>(null);
  const qrBtnRef  = useRef<any>(null);
  const goalRef   = useRef<any>(null);
  const { active: tourActive, finish: finishTour } = useTour('edit-child');
  const [tourVisible, setTourVisible] = useState(false);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (tourActive) {
      const t = setTimeout(() => {
        if (scrollRef.current && qrBtnRef.current) {
          qrBtnRef.current.measureLayout(
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
      ref: qrBtnRef,
      title: 'Connecter le téléphone 📱',
      body: 'Génère un QR code pour lier le téléphone de ' + (childName ?? 'l\'enfant') + ' à son profil.',
    },
    {
      ref: goalRef,
      title: 'Objectif de niveau 🎁',
      body: 'Fixe un niveau cible et une récompense promise — ' + (childName ?? 'l\'enfant') + ' sera motivé à progresser !',
    },
  ];

  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  function closeQr() {
    if (timerRef.current) clearInterval(timerRef.current);
    setQrToken(null);
    setQrSeconds(QR_TTL);
  }

  async function generateQr() {
    setQrLoading(true);
    try {
      const { token } = await authApi.generateQr(childId);
      setQrToken(token);
      setQrSeconds(QR_TTL);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQrSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setQrToken(null); return QR_TTL; }
          return s - 1;
        });
      }, 1000);
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de générer le QR code.' });
    } finally {
      setQrLoading(false);
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function saveGoal() {
    const level = parseInt(goalLevel, 10);
    if (goalLevel && (isNaN(level) || level < 1 || level > 999)) {
      showModal({ icon: '⚠️', title: 'Niveau invalide', message: 'Entre un niveau entre 1 et 999.' });
      return;
    }
    setGoalLoading(true);
    try {
      await childrenApi.setLevelObjective(childId, goalLevel ? level : null, goalReward || null);
      showModal({ icon: '✅', title: 'Objectif enregistré', message: goalLevel ? `Récompense prévue au niveau ${level}.` : 'Objectif supprimé.', buttons: [{ label: 'OK', style: 'default' }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de sauvegarder.' });
    } finally {
      setGoalLoading(false);
    }
  }

  const { data: statsData } = useApiData(() => childrenApi.get(childId), [childId]);

  useEffect(() => {
    if (statsData?.levelGoal)       setGoalLevel(String(statsData.levelGoal));
    if (statsData?.levelGoalReward) setGoalReward(statsData.levelGoalReward ?? '');
  }, [statsData]);

  async function save() {
    if (!name.trim()) { showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom de l\'enfant.' }); return; }
    setLoading(true);
    try {
      await childrenApi.update(childId, { name: name.trim() });
      showModal({ icon: '✅', title: 'Profil mis à jour', message: `Le profil de ${name} a été enregistré.`, buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de sauvegarder. Réessaie.' });
    } finally {
      setLoading(false);
    }
  }

  async function resetPin() {
    if (newPin.length < 4) { showModal({ icon: '🔢', title: 'Code trop court', message: 'Le code doit faire 4 chiffres.' }); return; }
    if (newPin !== confirm) { showModal({ icon: '❌', title: 'Codes différents', message: 'Les deux codes ne correspondent pas.', buttons: [{ label: 'Réessayer', style: 'default', onPress: () => { setConfirm(''); } }] }); return; }
    setLoading(true);
    try {
      await childrenApi.resetPin(childId, newPin);
      setNewPin(''); setConfirm(''); setPinMode(false);
      showModal({ icon: '✅', title: 'Code changé', message: `Le code secret de ${name} a été mis à jour.`, buttons: [{ label: 'OK', style: 'default' }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de changer le code. Réessaie.' });
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    showModal({
      icon: '⚠️', title: `Supprimer ${name} ?`,
      message: `Toutes les tâches, récompenses et points de ${name} seront définitivement supprimés.`,
      buttons: [
        { label: `Supprimer ${name}`, style: 'destructive', onPress: async () => {
          try {
            await childrenApi.delete(childId);
            showModal({ icon: '✅', title: 'Profil supprimé', message: `Le profil de ${name} a été supprimé.`, buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }] });
          } catch {
            showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de supprimer le profil. Réessaie.' });
          }
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => pinMode ? setPinMode(false) : router.back()}>
            <PixelText style={styles.backBtn}>←</PixelText>
          </TouchableOpacity>
          <PixelText style={styles.navTitle}>{pinMode ? 'Nouveau code' : `Modifier ${name}`}</PixelText>
          {!pinMode && (
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.5 }]} onPress={save} disabled={loading}>
              <PixelText style={styles.saveBtnText}>{loading ? '…' : 'Enregistrer'}</PixelText>
            </TouchableOpacity>
          )}
          {pinMode && <View style={{ width: 80 }} />}
        </View>

        {!pinMode ? (
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Avatar preview */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarPreviewCircle, { backgroundColor: (childColor ?? '#FFB300') + '33', borderColor: (childColor ?? '#FFB300') + '66' }]}>
                <PixelText style={styles.bigEmoji}>{childEmoji ?? '🦊'}</PixelText>
              </View>
              <PixelText style={styles.childNameDisplay}>{name}</PixelText>
            </View>

            {/* Niveau & classe (lecture seule) */}
            {statsData && (
              <View style={styles.rpgCard}>
                <PixelText style={styles.rpgEmoji}>{statsData.levelEmoji}</PixelText>
                <View style={styles.rpgInfo}>
                  <View style={styles.rpgTitleRow}>
                    <View style={styles.rpgLevelBadge}>
                      <PixelText style={styles.rpgLevelText}>Niv. {statsData.level}</PixelText>
                    </View>
                    <PixelText style={styles.rpgTitle}>{statsData.levelTitle}</PixelText>
                  </View>
                  <PixelText style={styles.rpgClass}>
                    {CLASS_EMOJI[statsData.class as ChildClass]} {CLASS_LABELS[statsData.class as ChildClass]}  ·  {statsData.xp} XP
                  </PixelText>
                </View>
              </View>
            )}

            {/* Prénom */}
            <PixelText style={styles.sectionLabel}>Prénom</PixelText>
            <View style={styles.card}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Prénom de l'enfant" placeholderTextColor={colors.textFaint} />
            </View>

            {/* Actions */}
            <PixelText style={styles.sectionLabel}>Sécurité</PixelText>
            <TouchableOpacity style={styles.actionRow} onPress={() => setPinMode(true)} activeOpacity={0.7}>
              <PixelText style={styles.actionIcon}>🔢</PixelText>
              <PixelText style={styles.actionText}>Changer le code secret</PixelText>
              <PixelText style={styles.actionArrow}>›</PixelText>
            </TouchableOpacity>
            <TouchableOpacity ref={qrBtnRef} style={styles.actionRow} onPress={generateQr} activeOpacity={0.7} disabled={qrLoading}>
              <PixelText style={styles.actionIcon}>📱</PixelText>
              <View style={{ flex: 1 }}>
                <PixelText style={styles.actionText}>Connecter le téléphone de {name}</PixelText>
                <PixelText style={{ fontSize: 11, color: colors.textFaint }}>Génère un QR code valable 30s</PixelText>
              </View>
              <PixelText style={styles.actionArrow}>{qrLoading ? '…' : '›'}</PixelText>
            </TouchableOpacity>

            <PixelText style={styles.sectionLabel}>Objectif de niveau</PixelText>
            <View ref={goalRef} collapsable={false} style={styles.card}>
              <PixelText style={styles.goalHint}>Quand {name} atteint ce niveau, tu reçois une notification.</PixelText>
              <View style={styles.goalRow}>
                <TextInput
                  style={[styles.goalLevelInput]}
                  value={goalLevel}
                  onChangeText={setGoalLevel}
                  placeholder="Niv."
                  placeholderTextColor={colors.textFaint}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <TextInput
                  style={[styles.goalRewardInput]}
                  value={goalReward}
                  onChangeText={setGoalReward}
                  placeholder="Récompense promise (ex: pizza 🍕)"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
              <TouchableOpacity
                style={[styles.goalSaveBtn, goalLoading && { opacity: 0.5 }]}
                onPress={saveGoal}
                disabled={goalLoading}
                activeOpacity={0.8}
              >
                <PixelText style={styles.goalSaveBtnText}>{goalLoading ? '…' : 'Enregistrer l\'objectif'}</PixelText>
              </TouchableOpacity>
            </View>

            <PixelText style={styles.sectionLabel}>Zone danger</PixelText>
            <TouchableOpacity style={styles.deleteRow} onPress={confirmDelete} activeOpacity={0.7}>
              <PixelText style={styles.actionIcon}>🗑️</PixelText>
              <PixelText style={[styles.actionText, { color: '#EF5350' }]}>Supprimer le profil</PixelText>
              <PixelText style={[styles.actionArrow, { color: '#EF5350' }]}>›</PixelText>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        ) : (
          /* PIN reset mode */
          <View style={styles.pinContent}>
            <PixelText style={styles.pinTitle}>Nouveau code pour {name}</PixelText>
            <PixelText style={styles.pinSub}>4 chiffres que {name} devra entrer</PixelText>
            <View style={[styles.avatarPreviewCircle, { backgroundColor: (childColor ?? '#FFB300') + '33', borderColor: (childColor ?? '#FFB300') + '66' }]}>
              <PixelText style={styles.bigEmoji}>{childEmoji ?? '🦊'}</PixelText>
            </View>

            {/* Étape */}
            <PixelText style={styles.pinStep}>{newPin.length < 4 ? 'Nouveau code' : 'Confirme le code'}</PixelText>
            <View style={styles.dots}>
              {[0,1,2,3].map(i => {
                const current = newPin.length < 4 ? newPin : confirm;
                return <View key={i} style={[styles.dot, current.length > i && styles.dotFilled]} />;
              })}
            </View>

            <View style={styles.numpad}>
              {KEYS.map((k, i) => k === '' ? <View key={i} style={styles.keyEmpty} /> : (
                <TouchableOpacity key={i} style={[styles.key, k === '⌫' && styles.keyDelete]}
                  onPress={() => {
                    if (k === '⌫') {
                      if (newPin.length < 4) setNewPin(p => p.slice(0,-1));
                      else setConfirm(p => p.slice(0,-1));
                    } else {
                      if (newPin.length < 4) setNewPin(p => p + k);
                      else if (confirm.length < 4) setConfirm(p => p + k);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <PixelText style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</PixelText>
                </TouchableOpacity>
              ))}
            </View>

            {newPin.length === 4 && confirm.length === 4 && (
              <TouchableOpacity style={[styles.saveBtn, { width: '100%', alignItems: 'center', padding: 16, borderRadius: Radii.md }, loading && { opacity: 0.5 }]} onPress={resetPin} disabled={loading}>
                <PixelText style={styles.saveBtnText}>{loading ? 'Enregistrement…' : 'Valider le nouveau code'}</PixelText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
      <AppModal config={modalCfg} onHide={hideModal} />
      <SpotlightTour
        steps={TOUR_STEPS}
        visible={tourVisible}
        onFinish={() => { setTourVisible(false); finishTour(); }}
      />

      {/* Modal QR code */}
      <Modal visible={!!qrToken} transparent animationType="fade" onRequestClose={closeQr}>
        <TouchableOpacity style={styles.qrOverlay} activeOpacity={1} onPress={closeQr}>
          <TouchableOpacity activeOpacity={1} style={styles.qrSheet} onPress={() => {}}>
            <PixelText style={styles.qrTitle}>QR code de {name}</PixelText>
            <PixelText style={styles.qrSub}>Demande à {name} de le scanner depuis son téléphone</PixelText>
            {qrToken && (
              <View style={styles.qrBox}>
                <QRCode value={qrToken} size={200} backgroundColor="#fff" color="#000" />
              </View>
            )}
            <View style={styles.qrTimer}>
              <PixelText style={[styles.qrTimerText, qrSeconds <= 5 && { color: '#EF5350' }]}>
                Expire dans {qrSeconds}s
              </PixelText>
            </View>
            <TouchableOpacity style={styles.qrRefreshBtn} onPress={generateQr} disabled={qrLoading}>
              <PixelText style={styles.qrRefreshText}>{qrLoading ? 'Génération…' : '🔄 Nouveau QR'}</PixelText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={closeQr}>
              <PixelText style={styles.qrCloseBtnText}>Fermer</PixelText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
