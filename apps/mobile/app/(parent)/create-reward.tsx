import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { rewardsApi } from '@/lib/api/rewards';
import { ApiError } from '@/lib/api-client';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Availability = 'unlimited' | 'once';

const QUICK_REWARDS = [
  { label: 'Soirée TV',         emoji: '📺', cost: 50  },
  { label: 'Choisir le dîner',  emoji: '🍕', cost: 80  },
  { label: 'Sortie au parc',    emoji: '🌳', cost: 100 },
  { label: '1h de jeu vidéo',   emoji: '🎮', cost: 60  },
  { label: 'Cinéma',            emoji: '🎬', cost: 120 },
  { label: 'Nuit chez un ami',  emoji: '🏕️', cost: 150 },
  { label: 'Dessert spécial',   emoji: '🍰', cost: 40  },
  { label: 'Choisir le film',   emoji: '🎥', cost: 30  },
];

const REWARD_EMOJIS = [
  '🎁','📺','🍕','🌳','🎮','🎬','🏕️','🍰','🎥','🎡','🏖️','🎠',
  '🎤','🍦','🎲','🚴','🏊','🎸','🎨','📚','🛹','⚽','🏀','🎯',
  '🍔','🍟','🍿','🧁','🥤','🍭','🎪','🎢','🎫','🏆','🌈','✈️',
];

const AVAIL_OPTIONS: { value: Availability; label: string; desc: string; icon: string }[] = [
  { value: 'unlimited', label: 'Illimitée',   desc: 'Peut être réclamée plusieurs fois',   icon: '♾️' },
  { value: 'once',      label: 'Une seule fois', desc: 'Disparaît une fois réclamée',      icon: '1️⃣' },
];

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:     { fontSize: 22, color: colors.textDim, fontWeight: '700', width: 40 },
  navTitle:    { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  saveBtn:     { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },

  quickScroll: { marginHorizontal: -Spacing.screen, paddingHorizontal: Spacing.screen },
  quickChip: {
    backgroundColor: colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, marginRight: 8,
    alignItems: 'center', gap: 4,
  },
  quickChipActive:    { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  quickEmoji:         { fontSize: 22 },
  quickChipText:      { fontSize: 12, fontWeight: '700', color: colors.textDim },
  quickChipTextActive:{ color: colors.gold },
  quickChipPts:       { fontSize: 11, fontWeight: '900', color: colors.textFaint },

  titleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  emojiBtn: {
    width: 56, height: 56, borderRadius: Radii.md,
    backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  emojiBtnText: { fontSize: 28 },
  emojiBtnHint: {
    position: 'absolute', bottom: 2, right: 4,
    fontSize: 9, color: colors.textFaint, fontWeight: '900',
  },

  // Emoji picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#1e1e26', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40, maxHeight: '65%',
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  pickerHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 16 },
  pickerGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerItem: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerItemActive: { borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },
  pickerEmoji: { fontSize: 26 },

  input: {
    backgroundColor: colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    height: 56,
  },

  ptsRow:  { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ptsChip: {
    width: 56, height: 56, borderRadius: Radii.card,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ptsChipActive:     { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  ptsChipText:       { fontSize: 15, fontWeight: '900', color: colors.textDim },
  ptsChipTextActive: { color: colors.gold },
  ptsInput: {
    flex: 1, height: 56, backgroundColor: colors.bgCard,
    borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border,
    textAlign: 'center', fontSize: 16, fontWeight: '900', color: colors.textPrimary,
  },
  ptsInputActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.08)' },

  availGroup:  { gap: 10 },
  availOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  availOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  availIcon:         { fontSize: 24 },
  availLabel:        { fontSize: 15, fontWeight: '800', color: colors.textDim },
  availLabelActive:  { color: colors.textPrimary },
  availDesc:         { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.textFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.gold },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },

  preview:     { gap: 10 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', padding: 16,
  },
  previewEmoji: { fontSize: 32 },
  previewTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  previewAvail: { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2 },
  previewCost:  { alignItems: 'center' },
  previewCostText: { fontSize: 22, fontWeight: '900', color: colors.gold },
  previewCostPts:  { fontSize: 11, fontWeight: '700', color: colors.textFaint },

  createBtn: {
    backgroundColor: colors.gold, borderRadius: Radii.md,
    padding: 18, alignItems: 'center',
  },
  createBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },
});

export default function CreateRewardScreen() {
  const { bottom } = useSafeAreaInsets();
  const [title, setTitle]           = useState('');
  const [emoji, setEmoji]           = useState('🎁');
  const [cost, setCost]             = useState('');
  const [availability, setAvail]    = useState<Availability>('unlimited');
  const [loading, setLoading]       = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  function applyQuick(q: typeof QUICK_REWARDS[0]) {
    setTitle(q.label);
    setEmoji(q.emoji);
    setCost(String(q.cost));
  }

  async function submit() {
    if (!title.trim()) {
      showModal({ icon: '✏️', title: 'Titre requis', message: 'Donne un nom à la récompense.' });
      return;
    }
    const pts = parseInt(cost, 10);
    if (!pts || pts < 1 || pts > 9999) {
      showModal({ icon: '🔢', title: 'Coût invalide', message: 'Entre un nombre de pièces entre 1 et 9999.' });
      return;
    }

    setLoading(true);
    try {
      await rewardsApi.create({ title, emoji, cost: pts, availability });
      showModal({
        icon: emoji,
        title: 'Récompense créée !',
        message: `"${title}" — ${pts} 🪙\n${availability === 'once' ? 'Une seule fois' : 'Illimitée'}.`,
        buttons: [{ label: 'Super !', style: 'default', onPress: () => router.back() }],
      });
    } catch (err) {
      showModal({ icon: '❌', title: 'Erreur', message: err instanceof ApiError ? err.message : 'Impossible de créer la récompense.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Nouvelle récompense</Text>
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.5 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{loading ? '…' : 'Créer'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Raccourcis */}
          <Text style={styles.sectionLabel}>Raccourcis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {QUICK_REWARDS.map(q => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickChip, title === q.label && styles.quickChipActive]}
                onPress={() => applyQuick(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickEmoji}>{q.emoji}</Text>
                <Text style={[styles.quickChipText, title === q.label && styles.quickChipTextActive]}>
                  {q.label}
                </Text>
                <Text style={[styles.quickChipPts, title === q.label && styles.quickChipTextActive]}>
                  {q.cost} 🪙
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nom + emoji */}
          <Text style={styles.sectionLabel}>Nom de la récompense</Text>
          <View style={styles.titleRow}>
            <TouchableOpacity style={styles.emojiBtn} onPress={() => setEmojiPicker(true)} activeOpacity={0.75}>
              <Text style={styles.emojiBtnText}>{emoji}</Text>
              <Text style={styles.emojiBtnHint}>✎</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Ex : Soirée TV"
              placeholderTextColor={colors.textFaint}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              maxLength={60}
            />
          </View>

          {/* Coût en pièces */}
          <Text style={styles.sectionLabel}>Coût en pièces 🪙</Text>
          <View style={styles.ptsRow}>
            {[30, 50, 80, 100].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.ptsChip, cost === String(p) && styles.ptsChipActive]}
                onPress={() => setCost(String(p))}
                activeOpacity={0.7}
              >
                <Text style={[styles.ptsChipText, cost === String(p) && styles.ptsChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[
                styles.ptsInput,
                !([30,50,80,100].map(String).includes(cost)) && cost !== '' && styles.ptsInputActive,
              ]}
              placeholder="Autre"
              placeholderTextColor={colors.textFaint}
              value={[30,50,80,100].map(String).includes(cost) ? '' : cost}
              onChangeText={v => setCost(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="done"
            />
          </View>

          {/* Disponibilité */}
          <Text style={styles.sectionLabel}>Disponibilité</Text>
          <View style={styles.availGroup}>
            {AVAIL_OPTIONS.map(a => (
              <TouchableOpacity
                key={a.value}
                style={[styles.availOption, availability === a.value && styles.availOptionActive]}
                onPress={() => setAvail(a.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.availIcon}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.availLabel, availability === a.value && styles.availLabelActive]}>
                    {a.label}
                  </Text>
                  <Text style={styles.availDesc}>{a.desc}</Text>
                </View>
                <View style={[styles.radio, availability === a.value && styles.radioActive]}>
                  {availability === a.value && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Aperçu */}
          {title.trim() && cost ? (
            <View style={styles.preview}>
              <Text style={styles.sectionLabel}>Aperçu</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewEmoji}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>{title}</Text>
                  <Text style={styles.previewAvail}>
                    {availability === 'once' ? '1️⃣ Une seule fois' : '♾️ Illimitée'}
                  </Text>
                </View>
                <View style={styles.previewCost}>
                  <Text style={styles.previewCostText}>{cost} 🪙</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Bouton créer */}
          <TouchableOpacity
            style={[styles.createBtn, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>
              {loading ? 'Création en cours…' : 'Créer la récompense ✓'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <AppModal config={modalCfg} onHide={hideModal} />

      {/* ── Emoji Picker ── */}
      <Modal visible={emojiPicker} transparent animationType="slide" onRequestClose={() => setEmojiPicker(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setEmojiPicker(false)}>
          <Pressable style={[styles.pickerSheet, { paddingBottom: 40 + bottom }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Choisir un icône</Text>
            <ScrollView contentContainerStyle={styles.pickerGrid} showsVerticalScrollIndicator={false}>
              {REWARD_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.pickerItem, emoji === e && styles.pickerItemActive]}
                  onPress={() => { setEmoji(e); setEmojiPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
