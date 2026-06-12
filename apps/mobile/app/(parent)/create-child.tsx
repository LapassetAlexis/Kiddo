import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useState, useMemo } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { childrenApi } from '@/lib/api/children';
import { ApiError } from '@/lib/api-client';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import HeroSprite from '@/components/HeroSprite';
import { CHARACTER_PRESETS, DEFAULT_PRESET, getPresetById, CLASS_META } from '@/lib/character-presets';

type Step = 'name' | 'character' | 'pin' | 'confirm';

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:  { fontSize: 22, color: colors.textDim, width: 40 },
  navTitle: { fontSize: 16, color: colors.textPrimary },

  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  stepDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  stepDotActive:{ backgroundColor: colors.gold, borderColor: colors.gold },
  stepDotDone:  { backgroundColor: 'rgba(255,184,0,0.3)', borderColor: 'rgba(255,184,0,0.4)' },

  // Étape 1 : nom
  content:   { padding: Spacing.screen, gap: 20 },
  stepTitle: { fontSize: 26, color: colors.textPrimary, lineHeight: 32 },
  stepSub:   { fontSize: 14, color: colors.textDim, marginTop: -12 },
  nameInput: {
    backgroundColor: colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 18, fontSize: 22, color: colors.textPrimary,
  },

  // Étape 2 : personnage
  characterList:   { padding: Spacing.screen, gap: 10 },
  characterHeader: { gap: 6, marginBottom: 8 },
  characterCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1.5, borderColor: colors.border, padding: 14,
  },
  characterCardSelected: {
    borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.05)',
  },
  spriteWrap:         { width: 72, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  spriteWrapSelected: { backgroundColor: 'rgba(255,184,0,0.1)' },
  characterInfo:     { flex: 1, gap: 4 },
  characterNameRow:  { gap: 2 },
  characterName:     { fontSize: 17, color: colors.textDim },
  characterNameSelected: { color: colors.textPrimary },
  characterTagline:  { fontSize: 12, color: colors.textFaint },
  classBadge:        { alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  classBadgeText:    { fontSize: 11 },
  characterStory:    { fontSize: 13, color: colors.textDim, lineHeight: 18, marginTop: 4 },
  radioOuter:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive:  { borderColor: colors.gold },
  radioInner:        { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },

  nextBtn:     { backgroundColor: colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, color: '#1a1000' },

  // PIN
  pinContent:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32, paddingBottom: 24 },
  pinTitle:       { fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  pinSub:         { fontSize: 13, color: colors.textDim, textAlign: 'center', lineHeight: 18, marginTop: -10 },
  spriteContainer: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pinCharPreview: { alignItems: 'center', gap: 6 },
  pinCharName:    { fontSize: 14, color: colors.textDim },
  dots: { flexDirection: 'row', gap: 16 },
  dot:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.textFaint, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: colors.gold, borderColor: colors.gold },
  numpad:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:       { width: 84, height: 84, borderRadius: Radii.hero, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:  { width: 84, height: 84 },
  keyDelete: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, color: colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: colors.textDim },
});

export default function CreateChildScreen() {
  const [step, setStep]         = useState<Step>('name');
  const [name, setName]         = useState('');
  const [character, setCharacter] = useState(DEFAULT_PRESET);
  const [pin, setPin]           = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading]   = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const selectedChar = getPresetById(character)!;

  function submitName() {
    if (!name.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom ou pseudo de l\'enfant.' });
      return;
    }
    setStep('character');
  }

  function submitCharacter() {
    setStep('pin');
  }

  function pressDigit(d: string, target: 'pin' | 'confirm') {
    const current = target === 'pin' ? pin : pinConfirm;
    if (current.length >= 4) return;
    const next = current + d;
    target === 'pin' ? setPin(next) : setPinConfirm(next);
    if (next.length === 4 && target === 'pin') setStep('confirm');
  }

  function pressDelete(target: 'pin' | 'confirm') {
    target === 'pin' ? setPin(p => p.slice(0, -1)) : setPinConfirm(p => p.slice(0, -1));
  }

  async function submitCreate() {
    if (pin !== pinConfirm) {
      showModal({
        icon: '🔢', title: 'Codes différents',
        message: 'Les deux codes ne correspondent pas.\nRecommence la confirmation.',
        buttons: [{ label: 'Réessayer', style: 'default', onPress: () => { setPinConfirm(''); setStep('confirm'); } }],
      });
      return;
    }
    setLoading(true);
    try {
      await childrenApi.create({
        name: name.trim(),
        avatar: selectedChar.emoji,
        color: '#FFB300',
        sprite: character,
        pin,
      });
    } catch (err) {
      showModal({ icon: '❌', title: 'Erreur', message: err instanceof ApiError ? err.message : 'Impossible de créer le profil.' });
      setLoading(false);
      return;
    }
    setLoading(false);
    showModal({
      icon: selectedChar.emoji,
      title: `${name} est prêt·e !`,
      message: `${selectedChar.name} t'attend pour de nouvelles aventures.`,
      buttons: [{ label: 'C\'est parti !', style: 'default', onPress: () => router.back() }],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const currentPin    = step === 'pin' ? pin : pinConfirm;
  const currentSetter = step === 'pin' ? 'pin' : 'confirm';

  const steps: Step[] = ['name', 'character', 'pin'];
  const stepIndex = { name: 0, character: 1, pin: 2, confirm: 2 };

  function goBack() {
    if (step === 'name')      router.back();
    else if (step === 'character') setStep('name');
    else if (step === 'pin')       setStep('character');
    else if (step === 'confirm')   setStep('pin');
  }

  const navTitle = {
    name: 'Nouvel enfant',
    character: 'Choisir un personnage',
    pin: 'Code secret',
    confirm: 'Confirmer le code',
  }[step];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={goBack}>
            <PixelText style={styles.backBtn}>←</PixelText>
          </TouchableOpacity>
          <PixelText style={styles.navTitle}>{navTitle}</PixelText>
          <View style={{ width: 40 }} />
        </View>

        {/* Indicateur d'étapes */}
        <View style={styles.steps}>
          {steps.map((s, i) => (
            <View key={s} style={[
              styles.stepDot,
              stepIndex[step] === i && styles.stepDotActive,
              stepIndex[step] > i && styles.stepDotDone,
            ]} />
          ))}
        </View>

        {/* ── Étape 1 : prénom ── */}
        {step === 'name' && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <PixelText style={styles.stepTitle}>Comment s'appelle{'\n'}ton héros ?</PixelText>
              <PixelText style={styles.stepSub}>Entre le prénom ou pseudo de l'enfant</PixelText>

              <TextInput
                style={styles.nameInput}
                placeholder="Ex : Lucas, Doudou, Princesse…"
                placeholderTextColor={colors.textFaint}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={submitName}
                maxLength={24}
              />

              <TouchableOpacity style={styles.nextBtn} onPress={submitName} activeOpacity={0.85}>
                <PixelText style={styles.nextBtnText}>Choisir son personnage →</PixelText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Étape 2 : personnage ── */}
        {step === 'character' && (
          <FlatList
            data={CHARACTER_PRESETS}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.characterList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.characterHeader}>
                <PixelText style={styles.stepTitle}>Qui sera{'\n'}{name} ?</PixelText>
                <PixelText style={styles.stepSub}>Chaque héros a sa propre histoire</PixelText>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.nextBtn, { marginTop: 8, marginBottom: 8 }]}
                onPress={submitCharacter}
                activeOpacity={0.85}
              >
                <PixelText style={styles.nextBtnText}>Choisir un code secret →</PixelText>
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const selected = character === item.id;
              return (
                <TouchableOpacity
                  style={[styles.characterCard, selected && styles.characterCardSelected]}
                  onPress={() => setCharacter(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.spriteWrap, selected && styles.spriteWrapSelected]}>
                    <HeroSprite source={item.baseStrip} size={64} direction="south" />
                  </View>
                  <View style={styles.characterInfo}>
                    <View style={styles.characterNameRow}>
                      <PixelText style={[styles.characterName, selected && styles.characterNameSelected]}>
                        {item.name}
                      </PixelText>
                      <PixelText style={styles.characterTagline}>{item.tagline}</PixelText>
                    </View>
                    <View style={[styles.classBadge, { backgroundColor: CLASS_META[item.class].color + '22', borderColor: CLASS_META[item.class].color + '55' }]}>
                      <PixelText style={[styles.classBadgeText, { color: CLASS_META[item.class].color }]}>
                        {CLASS_META[item.class].icon} {CLASS_META[item.class].label}
                      </PixelText>
                    </View>
                    {selected && (
                      <PixelText style={styles.characterStory}>{item.chapters[0]?.text}</PixelText>
                    )}
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ── Étapes 3 & 4 : PIN ── */}
        {(step === 'pin' || step === 'confirm') && (
          <View style={styles.pinContent}>
            <PixelText style={styles.pinTitle}>
              {step === 'pin' ? `Code secret de ${name}` : 'Répète le code'}
            </PixelText>
            <PixelText style={styles.pinSub}>
              {step === 'pin'
                ? '4 chiffres que l\'enfant devra entrer pour se connecter'
                : 'Entre à nouveau le même code pour confirmer'}
            </PixelText>

            <View style={styles.pinCharPreview}>
              <View style={styles.spriteContainer}>
                <HeroSprite source={selectedChar.baseStrip} size={80} direction="south" />
              </View>
              <PixelText style={styles.pinCharName}>{selectedChar.name}</PixelText>
            </View>

            <View style={styles.dots}>
              {[0,1,2,3].map(i => (
                <View key={i} style={[styles.dot, currentPin.length > i && styles.dotFilled]} />
              ))}
            </View>

            <View style={styles.numpad}>
              {KEYS.map((k, i) => k === '' ? (
                <View key={i} style={styles.keyEmpty} />
              ) : (
                <TouchableOpacity
                  key={i}
                  style={[styles.key, k === '⌫' && styles.keyDelete]}
                  onPress={() => k === '⌫' ? pressDelete(currentSetter as any) : pressDigit(k, currentSetter as any)}
                  activeOpacity={0.7}
                >
                  <PixelText style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</PixelText>
                </TouchableOpacity>
              ))}
            </View>

            {step === 'confirm' && currentPin.length === 4 && (
              <TouchableOpacity
                style={[styles.nextBtn, loading && { opacity: 0.6 }]}
                onPress={submitCreate}
                disabled={loading}
                activeOpacity={0.85}
              >
                <PixelText style={styles.nextBtnText}>
                  {loading ? 'Création…' : `Créer le profil de ${name} ✓`}
                </PixelText>
              </TouchableOpacity>
            )}
          </View>
        )}

      </KeyboardAvoidingView>
      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}
