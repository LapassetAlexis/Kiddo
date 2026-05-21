import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';

export default function JoinFamilyScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email, setEmail]         = useState('');
  const [inviteCode, setInviteCode] = useState(params.code ?? '');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [code, setCode]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  // ── Étape 1 ───────────────────────────────────────────────────────────────
  function nextStep() {
    if (!firstName.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre ton prénom.' }); return;
    }
    if (!email.trim() || !email.includes('@')) {
      showModal({ icon: '📧', title: 'Email invalide', message: 'Entre une adresse email valide.' }); return;
    }
    if (!inviteCode.trim()) {
      showModal({ icon: '🔑', title: 'Code requis', message: 'Entre le code de la famille.' }); return;
    }
    setStep(2);
  }

  // ── Étape 2 ───────────────────────────────────────────────────────────────
  async function join() {
    if (password.length < 8) {
      showModal({ icon: '🔒', title: 'Mot de passe trop court', message: 'Le mot de passe doit faire au moins 8 caractères.' }); return;
    }
    if (password !== confirm) {
      showModal({ icon: '❌', title: 'Mots de passe différents', message: 'Les deux mots de passe ne correspondent pas.' }); return;
    }

    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await authApi.joinFamily(fullName, email.trim().toLowerCase(), password, inviteCode.trim().toUpperCase());
      setCode('');
      setStep(3);
    } catch (err) {
      let msg = 'Erreur lors de la création du compte.';
      if (err instanceof ApiError) {
        if (err.status === 409) msg = 'Cet email est déjà utilisé.';
        else if (err.status === 404) msg = 'Code famille invalide. Vérifie le code et réessaie.';
      }
      showModal({ icon: '❌', title: 'Erreur', message: msg });
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 3 ───────────────────────────────────────────────────────────────
  async function verifyCode() {
    if (code.length < 6) {
      showModal({ icon: '🔢', title: 'Code incomplet', message: 'Le code de confirmation fait 6 chiffres.' }); return;
    }
    setLoading(true);
    try {
      const { accessToken } = await authApi.verifyEmail(email.trim().toLowerCase(), code);
      await authApi.saveToken(accessToken);
      showModal({
        icon: '🎉',
        title: 'Bienvenue !',
        message: `Tu as rejoint la famille, ${firstName} ! Tu peux maintenant gérer les enfants et les tâches.`,
        buttons: [{ label: 'Commencer →', style: 'default', onPress: () => router.replace('/(parent)/dashboard') }],
      });
    } catch {
      showModal({ icon: '❌', title: 'Code incorrect', message: 'Vérifie le code reçu par email et réessaie.', buttons: [{ label: 'Réessayer', style: 'default' }] });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setResending(true);
    try { await authApi.resendVerification(email.trim().toLowerCase()); } catch {}
    setResending(false);
    showModal({ icon: '📧', title: 'Code renvoyé', message: `Un nouveau code a été envoyé à ${email}.`, buttons: [{ label: 'OK', style: 'default' }] });
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.logoTitle}>Rejoindre</Text>
          <Text style={styles.logoSub}>une famille Kiddo</Text>
        </View>

        {/* Étapes */}
        <View style={styles.stepsRow}>
          <View style={[styles.stepLine, { backgroundColor: Colors.gold }]} />
          <View style={[styles.stepLine, { backgroundColor: step >= 2 ? Colors.gold : 'rgba(255,255,255,0.1)' }]} />
          <View style={[styles.stepLine, { backgroundColor: step === 3 ? Colors.gold : 'rgba(255,255,255,0.1)' }]} />
        </View>
        <Text style={styles.stepLabel}>
          {step === 1 ? 'Étape 1 sur 3 — Tes informations'
            : step === 2 ? 'Étape 2 sur 3 — Sécurise ton compte'
            : 'Étape 3 sur 3 — Confirme ton email'}
        </Text>

        {/* ── Étape 1 ── */}
        {step === 1 && (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Marie"
                placeholderTextColor={Colors.textFaint}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                placeholderTextColor={Colors.textFaint}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="marie@exemple.com"
                placeholderTextColor={Colors.textFaint}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Code famille</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="· · · · · · · ·"
                placeholderTextColor={Colors.textFaint}
                value={inviteCode}
                onChangeText={v => setInviteCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={nextStep}
                textAlign="center"
              />
              <Text style={styles.codeHint}>Ce code t'a été partagé par le premier parent</Text>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={nextStep} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Continuer →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Étape 2 ── */}
        {step === 2 && (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="8 caractères minimum"
                placeholderTextColor={Colors.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
              />
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[...Array(3)].map((_, i) => (
                    <View key={i} style={[
                      styles.strengthBar,
                      i === 0 && password.length >= 1 && { backgroundColor: password.length < 6 ? '#EF5350' : Colors.gold },
                      i === 1 && password.length >= 6 && { backgroundColor: password.length < 10 ? Colors.gold : Colors.green },
                      i === 2 && password.length >= 10 && { backgroundColor: Colors.green },
                    ]} />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort 💪'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirme le mot de passe</Text>
              <TextInput
                style={[styles.input, confirm.length > 0 && confirm !== password && styles.inputError]}
                placeholder="Répète ton mot de passe"
                placeholderTextColor={Colors.textFaint}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={join}
              />
              {confirm.length > 0 && confirm === password && (
                <Text style={styles.matchOk}>✓ Les mots de passe correspondent</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={join}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Création du compte…' : 'Rejoindre la famille ✓'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Étape 3 ── */}
        {step === 3 && (
          <View style={styles.form}>
            <View style={styles.emailIllus}>
              <Text style={styles.emailIllusEmoji}>📧</Text>
              <Text style={styles.emailIllusTitle}>Vérifie tes emails</Text>
              <Text style={styles.emailIllusDesc}>
                On a envoyé un code à 6 chiffres à{'\n'}
                <Text style={{ color: Colors.gold, fontWeight: '800' }}>{email}</Text>
              </Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Code de confirmation</Text>
              <TextInput
                style={[styles.input, styles.verifyInput]}
                placeholder="· · · · · ·"
                placeholderTextColor={Colors.textFaint}
                value={code}
                onChangeText={v => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
                textAlign="center"
              />
              <Text style={styles.codeHint}>Le code expire dans 15 minutes</Text>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, (loading || code.length < 6) && { opacity: 0.5 }]}
              onPress={verifyCode}
              disabled={loading || code.length < 6}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Vérification…' : 'Confirmer mon email ✓'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={resendCode} disabled={resending} activeOpacity={0.7}>
              <Text style={styles.resendText}>
                {resending ? 'Envoi en cours…' : 'Renvoyer le code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.loginLinkText}>Déjà un compte ? <Text style={{ color: Colors.gold, fontWeight: '900' }}>Se connecter</Text></Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.bgScreen },
  container: { paddingHorizontal: Spacing.screen, paddingTop: 60, gap: 24 },

  logoWrap:  { alignItems: 'center', gap: 8 },
  logoEmoji: { fontSize: 52 },
  logoTitle: { fontSize: 30, fontWeight: '900', color: Colors.gold, letterSpacing: -1 },
  logoSub:   { fontSize: 14, fontWeight: '700', color: Colors.textDim },

  stepsRow:  { flexDirection: 'row', gap: 8 },
  stepLine:  { flex: 1, height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontWeight: '700', color: Colors.textFaint, marginTop: -12 },

  form:       { gap: 16 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, fontSize: 16, fontWeight: '600',
    color: Colors.textPrimary,
  },
  inputError: { borderColor: 'rgba(239,83,80,0.5)' },
  codeInput:  { fontSize: 22, fontWeight: '900', letterSpacing: 8, color: Colors.gold },
  verifyInput:{ fontSize: 28, fontWeight: '900', letterSpacing: 12, color: Colors.gold },
  codeHint:   { fontSize: 11, fontWeight: '600', color: Colors.textFaint, textAlign: 'center' },

  strengthRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  strengthLabel:{ fontSize: 11, fontWeight: '700', color: Colors.textFaint, minWidth: 50 },
  matchOk:      { fontSize: 12, fontWeight: '700', color: Colors.green, marginTop: 4 },

  btnPrimary:     { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },

  backBtn:     { alignItems: 'center', padding: 12 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textDim },

  loginLink:     { alignItems: 'center', padding: 8 },
  loginLinkText: { fontSize: 14, fontWeight: '600', color: Colors.textDim },

  emailIllus:      { alignItems: 'center', gap: 8, paddingVertical: 8 },
  emailIllusEmoji: { fontSize: 52 },
  emailIllusTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  emailIllusDesc:  { fontSize: 14, fontWeight: '600', color: Colors.textDim, textAlign: 'center', lineHeight: 22 },

  resendBtn:  { alignItems: 'center', padding: 12, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border },
  resendText: { fontSize: 14, fontWeight: '700', color: Colors.textDim },
});
