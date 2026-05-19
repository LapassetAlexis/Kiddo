import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';

const AVATARS = ['🦊','🐻','🐼','🐨','🦁','🐯','🐸','🐙','🦄','🐶','🐱','🐰'];

type Step = 'info' | 'pin' | 'confirm';

export default function CreateChildScreen() {
  const [step, setStep]         = useState<Step>('info');
  const [name, setName]         = useState('');
  const [avatar, setAvatar]     = useState('🦊');
  const [pin, setPin]           = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading]   = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  // ── Step 1 : nom + avatar ──────────────────────────────────────────
  function submitInfo() {
    if (!name.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom de l\'enfant.' });
      return;
    }
    setStep('pin');
  }

  // ── Step 2 : saisie PIN ────────────────────────────────────────────
  function pressDigit(d: string, target: 'pin' | 'confirm') {
    const current = target === 'pin' ? pin : pinConfirm;
    if (current.length >= 4) return;
    const next = current + d;
    target === 'pin' ? setPin(next) : setPinConfirm(next);

    if (next.length === 4 && target === 'pin') {
      setStep('confirm');
    }
  }

  function pressDelete(target: 'pin' | 'confirm') {
    target === 'pin' ? setPin(p => p.slice(0, -1)) : setPinConfirm(p => p.slice(0, -1));
  }

  // ── Step 3 : confirmation PIN ──────────────────────────────────────
  async function submitCreate() {
    if (pin !== pinConfirm) {
      showModal({ icon: '🔢', title: 'Codes différents', message: 'Les deux codes ne correspondent pas.\nRecommence la confirmation.', buttons: [{ label: 'Réessayer', style: 'default', onPress: () => { setPinConfirm(''); setStep('confirm'); } }] });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    showModal({
      icon: avatar,
      title: `${name} ajouté·e !`,
      message: 'Le profil est créé. Tu peux maintenant lui assigner des tâches.',
      buttons: [{ label: 'Aller au tableau de bord', style: 'default', onPress: () => router.replace('/(parent)/dashboard') }],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const currentPin    = step === 'pin' ? pin : pinConfirm;
  const currentSetter = step === 'pin' ? 'pin' : 'confirm';

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Barre de navigation */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => step === 'info' ? router.back() : setStep(step === 'confirm' ? 'pin' : 'info')}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {step === 'info' ? 'Nouvel enfant' : step === 'pin' ? 'Code secret' : 'Confirmer le code'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Étapes */}
        <View style={styles.steps}>
          {(['info','pin','confirm'] as Step[]).map((s, i) => (
            <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive, (step === 'confirm' && i < 2 || step === 'pin' && i < 1) && styles.stepDotDone]} />
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
                <TouchableOpacity
                  key={a}
                  style={[styles.avatarOption, avatar === a && styles.avatarSelected]}
                  onPress={() => setAvatar(a)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prévisualisation */}
            <View style={styles.preview}>
              <View style={styles.previewAvatar}><Text style={{ fontSize: 32 }}>{avatar}</Text></View>
              <View>
                <Text style={styles.previewName}>{name || 'Prénom'}</Text>
                <Text style={styles.previewPts}>⭐ 0 pts</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={submitInfo} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Choisir un code secret →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── Étapes 2 & 3 : PIN ── */}
        {(step === 'pin' || step === 'confirm') && (
          <View style={styles.pinContent}>
            <Text style={styles.pinTitle}>
              {step === 'pin' ? `Code secret de ${name}` : 'Répète le code'}
            </Text>
            <Text style={styles.pinSub}>
              {step === 'pin' ? '4 chiffres que l\'enfant devra entrer pour se connecter' : 'Entre à nouveau le même code pour confirmer'}
            </Text>

            {/* Avatar + dots */}
            <View style={styles.pinAvatar}><Text style={{ fontSize: 40 }}>{avatar}</Text></View>
            <View style={styles.dots}>
              {[0,1,2,3].map(i => (
                <View key={i} style={[styles.dot, currentPin.length > i && styles.dotFilled]} />
              ))}
            </View>

            {/* Numpad */}
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
  previewAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,184,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  previewPts:  { fontSize: 13, fontWeight: '700', color: Colors.textFaint, marginTop: 2 },

  nextBtn: {
    backgroundColor: Colors.gold, borderRadius: Radii.md,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },

  // PIN
  pinContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32 },
  pinTitle:   { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  pinSub:     { fontSize: 13, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 18, marginTop: -12 },
  pinAvatar:  { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,184,0,0.12)', alignItems: 'center', justifyContent: 'center' },

  dots: { flexDirection: 'row', gap: 16 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.textFaint, backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.gold, borderColor: Colors.gold },

  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key: {
    width: 84, height: 84, borderRadius: Radii.hero,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty:  { width: 84, height: 84 },
  keyDelete: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: Colors.textDim },
});
