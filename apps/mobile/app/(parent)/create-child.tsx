import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { childrenApi } from '@/lib/api/children';
import { ApiError } from '@/lib/api-client';
import { Colors, Radii, Spacing } from '@/constants/theme';
import type { ChildClass } from '@/lib/rpg';
import { CLASS_LABELS, CLASS_EMOJI } from '@/lib/rpg';

const AVATARS = [
  '🦊','🐺','🦁','🐯','🦅','🐉','🦈','🦋',
  '⚽','🏀','🎯','🏄','🏂','🤸','🎾','🥊',
  '🎮','👾','🎸','🎧','🎨','🤖','🎤','🥁',
  '😎','⚡','🔥','🚀',
];

const COLORS = [
  '#FFB300', '#E53935', '#8E24AA', '#1E88E5',
  '#00897B', '#43A047', '#FB8C00', '#F06292',
  '#5C6BC0', '#26C6DA',
];

const CLASSES: { value: ChildClass; desc: string }[] = [
  { value: 'warrior', desc: 'Fort et courageux' },
  { value: 'archer',  desc: 'Rapide et précis' },
  { value: 'mage',    desc: 'Sage et mystérieux' },
  { value: 'rogue',   desc: 'Rusé et discret' },
  { value: 'paladin', desc: 'Noble et protecteur' },
];

type Step = 'info' | 'class' | 'pin' | 'confirm';

export default function CreateChildScreen() {
  const [step, setStep]             = useState<Step>('info');
  const [name, setName]             = useState('');
  const [avatar, setAvatar]         = useState('🦊');
  const [color, setColor]           = useState('#FFB300');
  const [childClass, setChildClass] = useState<ChildClass>('warrior');
  const [pin, setPin]               = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading]       = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  function submitInfo() {
    if (!name.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom de l\'enfant.' });
      return;
    }
    setStep('class');
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
      showModal({ icon: '🔢', title: 'Codes différents', message: 'Les deux codes ne correspondent pas.\nRecommence la confirmation.', buttons: [{ label: 'Réessayer', style: 'default', onPress: () => { setPinConfirm(''); setStep('confirm'); } }] });
      return;
    }
    setLoading(true);
    try {
      await childrenApi.create({ name: name.trim(), avatar, color, class: childClass, pin });
    } catch (err) {
      showModal({ icon: '❌', title: 'Erreur', message: err instanceof ApiError ? err.message : 'Impossible de créer le profil.' });
      setLoading(false);
      return;
    }
    setLoading(false);
    showModal({
      icon: avatar,
      title: `${name} ajouté·e !`,
      message: `Profil créé en tant que ${CLASS_EMOJI[childClass]} ${CLASS_LABELS[childClass]}.`,
      buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const currentPin    = step === 'pin' ? pin : pinConfirm;
  const currentSetter = step === 'pin' ? 'pin' : 'confirm';

  const stepIndex = { info: 0, class: 1, pin: 2, confirm: 3 };
  const steps: Step[] = ['info', 'class', 'pin', 'confirm'];

  function goBack() {
    if (step === 'info')    router.back();
    else if (step === 'class')   setStep('info');
    else if (step === 'pin')     setStep('class');
    else if (step === 'confirm') setStep('pin');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.navbar}>
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {step === 'info' ? 'Nouvel enfant' : step === 'class' ? 'Choisir une classe' : step === 'pin' ? 'Code secret' : 'Confirmer le code'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Indicateur d'étapes */}
        <View style={styles.steps}>
          {steps.map((s, i) => (
            <View key={s} style={[
              styles.stepDot,
              step === s && styles.stepDotActive,
              stepIndex[step] > i && styles.stepDotDone,
            ]} />
          ))}
        </View>

        {/* ── Étape 1 : info ── */}
        {step === 'info' && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Lucas"
              placeholderTextColor={Colors.textFaint}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={submitInfo}
            />

            <Text style={styles.sectionLabel}>Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map(a => (
                <TouchableOpacity key={a} style={[styles.avatarOption, avatar === a && styles.avatarSelected]} onPress={() => setAvatar(a)} activeOpacity={0.7}>
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Couleur</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]} onPress={() => setColor(c)} activeOpacity={0.7} />
              ))}
            </View>

            <View style={styles.preview}>
              <View style={[styles.previewAvatar, { backgroundColor: color }]}><Text style={{ fontSize: 32 }}>{avatar}</Text></View>
              <View>
                <Text style={styles.previewName}>{name || 'Prénom'}</Text>
                <Text style={styles.previewSub}>Niveau 1 · Apprenti</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={submitInfo} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Choisir une classe →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── Étape 2 : classe ── */}
        {step === 'class' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.classIntro}>La classe définit l'univers du personnage et ses emojis de niveau. Tu pourras en changer plus tard.</Text>

            {CLASSES.map(c => {
              const selected = childClass === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.classOption, selected && styles.classOptionActive]}
                  onPress={() => setChildClass(c.value)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.classEmoji}>{CLASS_EMOJI[c.value]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.classLabel, selected && styles.classLabelActive]}>{CLASS_LABELS[c.value]}</Text>
                    <Text style={styles.classDesc}>{c.desc}</Text>
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.nextBtn, { marginTop: 8 }]} onPress={() => setStep('pin')} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Choisir un code secret →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── Étapes 3 & 4 : PIN ── */}
        {(step === 'pin' || step === 'confirm') && (
          <View style={styles.pinContent}>
            <Text style={styles.pinTitle}>
              {step === 'pin' ? `Code secret de ${name}` : 'Répète le code'}
            </Text>
            <Text style={styles.pinSub}>
              {step === 'pin' ? '4 chiffres que l\'enfant devra entrer pour se connecter' : 'Entre à nouveau le même code pour confirmer'}
            </Text>

            <View style={[styles.pinAvatar, { backgroundColor: color }]}><Text style={{ fontSize: 40 }}>{avatar}</Text></View>
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
              <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.6 }]} onPress={submitCreate} disabled={loading} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>{loading ? 'Création…' : `Créer le profil de ${name} ✓`}</Text>
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

  content: { padding: Spacing.screen, gap: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },

  input: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
  },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarOption: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSelected: { borderColor: Colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },
  avatarEmoji: { fontSize: 30 },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  previewAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  previewName:   { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  previewSub:    { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  // Classe
  classIntro: { fontSize: 13, fontWeight: '600', color: Colors.textDim, lineHeight: 18 },
  classOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  classOptionActive: { borderColor: 'rgba(255,184,0,0.4)', backgroundColor: 'rgba(255,184,0,0.06)' },
  classEmoji:        { fontSize: 32, width: 40, textAlign: 'center' },
  classLabel:        { fontSize: 16, fontWeight: '800', color: Colors.textDim },
  classLabelActive:  { color: Colors.textPrimary },
  classDesc:         { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },
  radioOuter:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive:  { borderColor: Colors.gold },
  radioInner:        { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },

  nextBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },

  // PIN
  pinContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32 },
  pinTitle:   { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  pinSub:     { fontSize: 13, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 18, marginTop: -12 },
  pinAvatar:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 16 },
  dot:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textFaint, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:       { width: 84, height: 84, borderRadius: Radii.hero, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:  { width: 84, height: 84 },
  keyDelete: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: Colors.textDim },
});
