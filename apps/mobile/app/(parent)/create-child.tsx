import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useState } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { childrenApi } from '@/lib/api/children';
import { ApiError } from '@/lib/api-client';
import { Colors, Radii, Spacing } from '@/constants/theme';
import HeroSprite from '@/components/HeroSprite';
import { CHARACTER_PRESETS, DEFAULT_PRESET, getPresetById, getPresetSprite } from '@/lib/character-presets';

type Step = 'name' | 'character' | 'pin' | 'confirm';

export default function CreateChildScreen() {
  const [step, setStep]         = useState<Step>('name');
  const [name, setName]         = useState('');
  const [character, setCharacter] = useState(DEFAULT_PRESET);
  const [pin, setPin]           = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading]   = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

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
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{navTitle}</Text>
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
              <Text style={styles.stepTitle}>Comment s'appelle{'\n'}ton héros ?</Text>
              <Text style={styles.stepSub}>Entre le prénom ou pseudo de l'enfant</Text>

              <TextInput
                style={styles.nameInput}
                placeholder="Ex : Lucas, Doudou, Princesse…"
                placeholderTextColor={Colors.textFaint}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={submitName}
                maxLength={24}
              />

              <TouchableOpacity style={styles.nextBtn} onPress={submitName} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>Choisir son personnage →</Text>
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
                <Text style={styles.stepTitle}>Qui sera{'\n'}{name} ?</Text>
                <Text style={styles.stepSub}>Chaque héros a sa propre histoire</Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.nextBtn, { marginTop: 8, marginBottom: 8 }]}
                onPress={submitCharacter}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Choisir un code secret →</Text>
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
                    <HeroSprite source={getPresetSprite(item.id).source} size={64} direction="south" />
                  </View>
                  <View style={styles.characterInfo}>
                    <View style={styles.characterNameRow}>
                      <Text style={[styles.characterName, selected && styles.characterNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.characterTagline}>{item.tagline}</Text>
                    </View>
                    {selected && (
                      <Text style={styles.characterStory}>{item.story}</Text>
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
            <Text style={styles.pinTitle}>
              {step === 'pin' ? `Code secret de ${name}` : 'Répète le code'}
            </Text>
            <Text style={styles.pinSub}>
              {step === 'pin'
                ? '4 chiffres que l\'enfant devra entrer pour se connecter'
                : 'Entre à nouveau le même code pour confirmer'}
            </Text>

            <View style={styles.pinCharPreview}>
              <View style={styles.spriteContainer}>
                <HeroSprite source={getPresetSprite(character).source} size={80} direction="south" />
              </View>
              <Text style={styles.pinCharName}>{selectedChar.name}</Text>
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
                  <Text style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</Text>
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
                <Text style={styles.nextBtnText}>
                  {loading ? 'Création…' : `Créer le profil de ${name} ✓`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </KeyboardAvoidingView>
      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { fontSize: 22, color: Colors.textDim, fontWeight: '700', width: 40 },
  navTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },

  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  stepDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  stepDotActive:{ backgroundColor: Colors.gold, borderColor: Colors.gold },
  stepDotDone:  { backgroundColor: 'rgba(255,184,0,0.3)', borderColor: 'rgba(255,184,0,0.4)' },

  // Étape 1 : nom
  content:   { padding: Spacing.screen, gap: 20 },
  stepTitle: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary, lineHeight: 32 },
  stepSub:   { fontSize: 14, fontWeight: '600', color: Colors.textDim, marginTop: -12 },
  nameInput: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 18, fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
  },

  // Étape 2 : personnage
  characterList:   { padding: Spacing.screen, gap: 10 },
  characterHeader: { gap: 6, marginBottom: 8 },
  characterCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1.5, borderColor: Colors.border, padding: 14,
  },
  characterCardSelected: {
    borderColor: Colors.gold, backgroundColor: 'rgba(255,184,0,0.05)',
  },
  spriteWrap:         { width: 72, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  spriteWrapSelected: { backgroundColor: 'rgba(255,184,0,0.1)' },
  characterInfo:     { flex: 1, gap: 4 },
  characterNameRow:  { gap: 2 },
  characterName:     { fontSize: 17, fontWeight: '900', color: Colors.textDim },
  characterNameSelected: { color: Colors.textPrimary },
  characterTagline:  { fontSize: 12, fontWeight: '700', color: Colors.textFaint },
  characterStory:    { fontSize: 13, fontWeight: '500', color: Colors.textDim, lineHeight: 18, marginTop: 4 },
  radioOuter:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive:  { borderColor: Colors.gold },
  radioInner:        { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },

  nextBtn:     { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },

  // PIN
  pinContent:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 },
  pinTitle:       { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  pinSub:         { fontSize: 13, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 18, marginTop: -10 },
  spriteContainer: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pinCharPreview: { alignItems: 'center', gap: 6 },
  pinCharName:    { fontSize: 14, fontWeight: '800', color: Colors.textDim },
  dots: { flexDirection: 'row', gap: 16 },
  dot:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textFaint, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  numpad:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:       { width: 84, height: 84, borderRadius: Radii.hero, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:  { width: 84, height: 84 },
  keyDelete: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: Colors.textDim },
});
