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
import { Radii, Spacing, Fonts, PixelShadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import SpriteCharacter, { type AvatarConfig } from '@/components/SpriteCharacter';
import { CLASS_DEFAULTS, SPRITE_ASSETS, type ChildPath, type LayerKey } from '@/constants/sprites';

type Step = 'name' | 'path' | 'customize' | 'pin' | 'confirm';

type CustomizeCategory = { key: LayerKey | 'skin'; label: string; nullable?: boolean };
const CUSTOMIZE_CATEGORIES: CustomizeCategory[] = [
  { key: 'skin',  label: 'Peau' },
  { key: 'head',  label: 'Tête' },
  { key: 'hair',  label: 'Cheveux' },
];

type SkinTone = '' | 'tone1' | 'tone2' | 'tone3' | 'green' | 'blue' | 'purple' | 'grey';

const SKIN_OPTIONS: { tone: SkinTone; color: string }[] = [
  { tone: '',       color: '#f4d29c' },
  { tone: 'tone1',  color: '#d49149' },
  { tone: 'tone2',  color: '#b97e50' },
  { tone: 'tone3',  color: '#986743' },
  { tone: 'green',  color: '#82cb60' },
  { tone: 'blue',   color: '#70b4e0' },
  { tone: 'purple', color: '#a878d0' },
  { tone: 'grey',   color: '#a0a0a0' },
];

const PATHS: ChildPath[] = ['warrior', 'rogue', 'archer', 'mage'];

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
  stepDot:      { width: 8, height: 8, borderRadius: 0, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  stepDotActive:{ backgroundColor: colors.gold, borderColor: colors.gold },
  stepDotDone:  { backgroundColor: 'rgba(255,184,0,0.3)', borderColor: 'rgba(255,184,0,0.4)' },

  content:   { padding: Spacing.screen, gap: 20 },
  stepTitle: { fontSize: 26, color: colors.textPrimary, lineHeight: 32 },
  stepSub:   { fontSize: 14, color: colors.textDim, marginTop: -12 },
  nameInput: {
    backgroundColor: colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 18, fontSize: 22, color: colors.textPrimary,
    fontFamily: Fonts.pixel,
  },

  // Path selection
  pathGrid:  { padding: Spacing.screen, gap: 12 },
  pathCard: {
    borderRadius: Radii.card, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.bgCard, padding: 18, gap: 6,
  },
  pathCardSelected: { borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.05)' },
  pathEmoji: { fontSize: 32, textAlign: 'center', alignSelf: 'center' },
  pathLabel: { fontSize: 14, fontFamily: Fonts.pixelBold, color: colors.textPrimary, textAlign: 'center' },
  pathDesc:  { fontSize: 13, fontFamily: Fonts.pixel, color: colors.textDim, lineHeight: 18, textAlign: 'center' },

  // Customize
  customizeRoot: { flex: 1 },
  previewArea: {
    alignItems: 'center', paddingTop: 20, paddingBottom: 16, gap: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  previewMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skinPicker:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  skinLabel:     { fontSize: 11, fontFamily: Fonts.pixel, color: colors.textDim },
  skinDot:       { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  skinDotActive: { borderColor: colors.gold },
  previewPath:   { fontSize: 12, fontFamily: Fonts.pixel, color: colors.textDim },
  previewName:   { fontSize: 20, fontFamily: Fonts.pixelBold, color: colors.textPrimary },
  categoryTabs:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryTab:   {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radii.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  categoryTabActive: { borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },
  categoryTabText:   { fontSize: 13, fontFamily: Fonts.pixel, color: colors.textDim },
  categoryTabTextActive: { color: colors.gold },
  itemGrid: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16, gap: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  skinGrid: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  skinCard: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  skinCardActive: { borderColor: colors.gold },
  skinCircle: { width: 56, height: 56, borderRadius: 28 },
  skinCardLabel: { fontSize: 10, fontFamily: Fonts.pixel, color: colors.textDim },
  itemBtn: {
    width: 80, height: 80, borderRadius: Radii.card,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  itemBtnActive: { borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },
  itemBtnNone:   { borderStyle: 'dashed' },
  itemBtnNoneText: { fontSize: 20, color: colors.textFaint },

  nextBtn:     { backgroundColor: colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center', ...PixelShadow.gold },
  nextBtnText: { fontSize: 11, fontFamily: Fonts.pixelBold, color: '#1a1000' },
  nextBtnWrap: { padding: Spacing.screen },

  // PIN
  pinContent:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32, paddingBottom: 24 },
  pinTitle:       { fontSize: 20, fontFamily: Fonts.pixel, color: colors.textPrimary, textAlign: 'center' },
  pinSub:         { fontSize: 13, fontFamily: Fonts.pixel, color: colors.textDim, textAlign: 'center', lineHeight: 18, marginTop: -10 },
  pinCharPreview: { alignItems: 'center', gap: 6 },
  pinCharName:    { fontSize: 14, fontFamily: Fonts.pixel, color: colors.textDim },
  dots: { flexDirection: 'row', gap: 16 },
  dot:       { width: 16, height: 16, borderRadius: 0, borderWidth: 2, borderColor: colors.textFaint, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: colors.gold, borderColor: colors.gold },
  numpad:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:       { width: 84, height: 84, borderRadius: Radii.hero, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:  { width: 84, height: 84 },
  keyDelete: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, fontFamily: Fonts.pixel, color: colors.textPrimary },
  keyDeleteText: { fontSize: 22, fontFamily: Fonts.pixel, color: colors.textDim },
});

export default function CreateChildScreen() {
  const [step, setStep]       = useState<Step>('name');
  const [name, setName]       = useState('');
  const [path, setPath]       = useState<ChildPath>('warrior');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({});
  const [activeCategory, setActiveCategory] = useState<LayerKey | 'skin'>('skin');
  const [pin, setPin]         = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const defaults = CLASS_DEFAULTS[path];
  const effectiveConfig: AvatarConfig = { ...defaults, ...avatarConfig };

  function submitName() {
    if (!name.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom ou pseudo de l\'enfant.' });
      return;
    }
    setStep('path');
  }

  function submitPath() {
    setAvatarConfig({});
    setActiveCategory('skin');
    setStep('customize');
  }

  function changeSkinTone(tone: SkinTone) {
    setAvatarConfig(cfg => ({ ...cfg, skinTone: tone || undefined }));
  }

  function submitCustomize() {
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
        name:         name.trim(),
        avatar:       defaults.emoji,
        color:        defaults.color,
        class:        path,
        avatarConfig: effectiveConfig,
        pin,
      });
    } catch (err) {
      showModal({ icon: '❌', title: 'Erreur', message: err instanceof ApiError ? err.message : 'Impossible de créer le profil.' });
      setLoading(false);
      return;
    }
    setLoading(false);
    showModal({
      icon: defaults.emoji,
      title: `${name} est prêt·e !`,
      message: `Bonne aventure, ${defaults.label} !`,
      buttons: [{ label: 'C\'est parti !', style: 'default', onPress: () => router.back() }],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const currentPin    = step === 'pin' ? pin : pinConfirm;
  const currentSetter = step === 'pin' ? 'pin' : 'confirm';

  const steps: Step[] = ['name', 'path', 'customize', 'pin'];
  const stepIndex: Record<Step, number> = { name: 0, path: 1, customize: 2, pin: 3, confirm: 3 };

  function goBack() {
    if (step === 'name')      router.back();
    else if (step === 'path')     setStep('name');
    else if (step === 'customize') setStep('path');
    else if (step === 'pin')       setStep('customize');
    else if (step === 'confirm')   setStep('pin');
  }

  const navTitle: Record<Step, string> = {
    name:      'Nouvel enfant',
    path:      'Choisir une voie',
    customize: 'Créer le personnage',
    pin:       'Code secret',
    confirm:   'Confirmer le code',
  };

  // Items available for active category
  const categoryAssets = activeCategory !== 'skin' ? (SPRITE_ASSETS[activeCategory] ?? {}) : {};
  const categoryOptions = Object.keys(categoryAssets).filter(k => !/_(?:tone\d|green|blue|purple|grey)$/.test(k));
  const activeCat = CUSTOMIZE_CATEGORIES.find(c => c.key === activeCategory);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={goBack}>
            <PixelText style={styles.backBtn}>←</PixelText>
          </TouchableOpacity>
          <PixelText style={styles.navTitle}>{navTitle[step]}</PixelText>
          <View style={{ width: 40 }} />
        </View>

        {/* Step dots */}
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
                <PixelText style={styles.nextBtnText}>Choisir sa voie →</PixelText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Étape 2 : voie ── */}
        {step === 'path' && (
          <FlatList
            data={PATHS}
            keyExtractor={p => p}
            contentContainerStyle={styles.pathGrid}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ gap: 6, marginBottom: 8 }}>
                <PixelText style={styles.stepTitle}>Quelle est{'\n'}la voie de {name} ?</PixelText>
                <PixelText style={styles.stepSub}>Elle définit son style de jeu</PixelText>
              </View>
            }
            ListFooterComponent={
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity style={styles.nextBtn} onPress={submitPath} activeOpacity={0.85}>
                  <PixelText style={styles.nextBtnText}>Créer le personnage →</PixelText>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: p }) => {
              const def = CLASS_DEFAULTS[p];
              const selected = path === p;
              return (
                <TouchableOpacity
                  style={[styles.pathCard, { flex: 1 }, selected && styles.pathCardSelected]}
                  onPress={() => setPath(p)}
                  activeOpacity={0.75}
                >
                  <PixelText style={styles.pathEmoji}>{def.emoji}</PixelText>
                  <PixelText style={[styles.pathLabel, selected && { color: colors.gold }]}>{def.label}</PixelText>
                  <PixelText style={styles.pathDesc}>{def.description}</PixelText>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ── Étape 3 : personnalisation ── */}
        {step === 'customize' && (
          <View style={styles.customizeRoot}>
            {/* Preview */}
            <View style={styles.previewArea}>
              <SpriteCharacter
                path={path}
                avatarConfig={{ ...effectiveConfig, hat: null }}
                animation="walk"
                direction="south"
                size={160}
                fps={6}
              />
              <PixelText style={styles.previewName}>{name}</PixelText>
              <PixelText style={styles.previewPath}>{defaults.emoji} {defaults.label}</PixelText>
            </View>

            {/* Category tabs */}
            <View style={styles.categoryTabs}>
              {CUSTOMIZE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryTab, activeCategory === cat.key && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.75}
                >
                  <PixelText style={[styles.categoryTabText, activeCategory === cat.key && styles.categoryTabTextActive]}>
                    {cat.label}
                  </PixelText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Item grid */}
            {activeCategory === 'skin' ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.skinGrid}>
                {SKIN_OPTIONS.map(({ tone, color }, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.skinCard, (avatarConfig.skinTone ?? '') === tone && styles.skinCardActive]}
                    onPress={() => changeSkinTone(tone)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.skinCircle, { backgroundColor: color }]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.itemGrid}>
              {categoryOptions.map(key => (
                <TouchableOpacity
                  key={key}
                  style={[styles.itemBtn, effectiveConfig[activeCategory as LayerKey] === key && styles.itemBtnActive]}
                  onPress={() => setAvatarConfig(cfg => ({ ...cfg, [activeCategory]: key }))}
                  activeOpacity={0.75}
                >
                  <SpriteCharacter
                    path={path}
                    avatarConfig={{ ...effectiveConfig, hat: null, [activeCategory]: key }}
                    animation="idle"
                    direction="south"
                    size={72}
                    fps={1}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            )}

            <View style={styles.nextBtnWrap}>
              <TouchableOpacity style={styles.nextBtn} onPress={submitCustomize} activeOpacity={0.85}>
                <PixelText style={styles.nextBtnText}>Choisir un code secret →</PixelText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Étapes 4 & 5 : PIN ── */}
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
              <SpriteCharacter
                path={path}
                avatarConfig={effectiveConfig}
                animation="idle"
                direction="south"
                size={96}
              />
              <PixelText style={styles.pinCharName}>{name} · {defaults.label}</PixelText>
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
