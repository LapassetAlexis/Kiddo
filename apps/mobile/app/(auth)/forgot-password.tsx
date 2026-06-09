import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';
import { router } from 'expo-router';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AppModal, { useAppModal } from '@/components/ui/AppModal';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ── Étape 1 : envoi du code ───────────────────────────────────────────────
  async function sendCode() {
    if (!email.trim() || !email.includes('@')) {
      showModal({ icon: '📧', title: 'Email invalide', message: 'Entre une adresse email valide.' });
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setCode('');
      setStep('code');
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible d\'envoyer le code. Vérifie l\'email saisi.' });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setResending(true);
    try { await authApi.forgotPassword(email.trim().toLowerCase()); } catch {}
    setResending(false);
    showModal({ icon: '📧', title: 'Code renvoyé', message: `Un nouveau code a été envoyé à ${email}.`, buttons: [{ label: 'OK', style: 'default' }] });
  }

  // ── Étape 2 : vérification du code ───────────────────────────────────────
  async function verifyCode() {
    if (code.length < 6) {
      showModal({ icon: '🔢', title: 'Code incomplet', message: 'Le code fait 6 chiffres.' });
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyResetCode(email.trim().toLowerCase(), code);
      setNewPwd('');
      setConfirmPwd('');
      setStep('password');
    } catch {
      showModal({ icon: '❌', title: 'Code incorrect', message: 'Vérifie le code reçu par email.', buttons: [{ label: 'Réessayer', style: 'default' }] });
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 3 : nouveau mot de passe ───────────────────────────────────────
  async function resetPassword() {
    if (newPwd.length < 8) {
      showModal({ icon: '🔒', title: 'Mot de passe trop court', message: '8 caractères minimum.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      showModal({ icon: '❌', title: 'Mots de passe différents', message: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), code, newPwd);
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de réinitialiser le mot de passe.' });
      setLoading(false);
      return;
    }
    setLoading(false);

    showModal({
      icon: '✅',
      title: 'Mot de passe réinitialisé !',
      message: 'Tu peux maintenant te connecter avec ton nouveau mot de passe.',
      buttons: [{ label: 'Se connecter', style: 'default', onPress: () => router.replace('/(auth)/login') }],
    });
  }

  const STEP_CONFIG = {
    email:    { index: 1, label: 'Ton email' },
    code:     { index: 2, label: 'Code de vérification' },
    password: { index: 3, label: 'Nouveau mot de passe' },
  };
  const steps = ['email', 'code', 'password'] as Step[];
  const current = STEP_CONFIG[step];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 'email' ? router.back() : setStep(steps[steps.indexOf(step) - 1])}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Mot de passe oublié</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Illustration */}
        <View style={styles.illusWrap}>
          <Text style={styles.illusEmoji}>
            {step === 'email' ? '🔑' : step === 'code' ? '📧' : '🔒'}
          </Text>
          <Text style={styles.illusTitle}>
            {step === 'email' ? 'Réinitialise ton mot de passe'
              : step === 'code' ? 'Vérifie tes emails'
              : 'Crée un nouveau mot de passe'}
          </Text>
          <Text style={styles.illusDesc}>
            {step === 'email'
              ? 'Entre l\'email de ton compte.\nOn t\'envoie un code de réinitialisation.'
              : step === 'code'
              ? `On a envoyé un code à 6 chiffres à\n${email}`
              : 'Choisis un nouveau mot de passe\npour sécuriser ton compte.'}
          </Text>
        </View>

        {/* Barre de progression */}
        <View style={styles.stepsRow}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.stepBar, steps.indexOf(step) >= i && { backgroundColor: colors.gold }]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Étape {current.index} sur 3 — {current.label}</Text>

        {/* ── Étape 1 : email ── */}
        {step === 'email' && (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Adresse email</Text>
              <TextInput
                style={styles.input}
                placeholder="marie@exemple.com"
                placeholderTextColor={colors.textFaint}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={sendCode}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={sendCode}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Envoi du code…' : 'Recevoir le code →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Étape 2 : code ── */}
        {step === 'code' && (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Code à 6 chiffres</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="· · · · · ·"
                placeholderTextColor={colors.textFaint}
                value={code}
                onChangeText={v => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
                textAlign="center"
                autoFocus
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
                {loading ? 'Vérification…' : 'Vérifier le code →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={resendCode} disabled={resending} activeOpacity={0.7}>
              <Text style={styles.resendText}>
                {resending ? 'Envoi en cours…' : '📨 Renvoyer le code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('email')} activeOpacity={0.7}>
              <Text style={styles.cancelText}>← Modifier l'email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Étape 3 : nouveau mot de passe ── */}
        {step === 'password' && (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="8 caractères minimum"
                placeholderTextColor={colors.textFaint}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry
                returnKeyType="next"
                autoFocus
              />
              {newPwd.length > 0 && (
                <View style={styles.strengthRow}>
                  {[...Array(3)].map((_, i) => (
                    <View key={i} style={[
                      styles.strengthBar,
                      i === 0 && newPwd.length >= 1  && { backgroundColor: newPwd.length < 6 ? '#EF5350' : colors.gold },
                      i === 1 && newPwd.length >= 6  && { backgroundColor: newPwd.length < 10 ? colors.gold : colors.green },
                      i === 2 && newPwd.length >= 10 && { backgroundColor: colors.green },
                    ]} />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {newPwd.length < 6 ? 'Faible' : newPwd.length < 10 ? 'Moyen' : 'Fort 💪'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirme le mot de passe</Text>
              <TextInput
                style={[styles.input, confirmPwd.length > 0 && confirmPwd !== newPwd && styles.inputError]}
                placeholder="Répète ton mot de passe"
                placeholderTextColor={colors.textFaint}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={resetPassword}
              />
              {confirmPwd.length > 0 && confirmPwd === newPwd && (
                <Text style={styles.matchOk}>✓ Les mots de passe correspondent</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={resetPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Enregistrement…' : 'Réinitialiser le mot de passe ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bgScreen },
  container: { paddingHorizontal: Spacing.screen, gap: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 4,
  },
  backBtn:  { fontSize: 22, color: colors.textDim, fontWeight: '700', width: 40 },
  navTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },

  illusWrap:  { alignItems: 'center', gap: 10, paddingVertical: 8 },
  illusEmoji: { fontSize: 56 },
  illusTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  illusDesc:  { fontSize: 14, fontWeight: '600', color: colors.textDim, textAlign: 'center', lineHeight: 22 },

  stepsRow: { flexDirection: 'row', gap: 8 },
  stepBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLabel:{ fontSize: 12, fontWeight: '700', color: colors.textFaint, marginTop: -10 },

  form:       { gap: 14 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, fontSize: 16, fontWeight: '600', color: colors.textPrimary,
  },
  inputError: { borderColor: 'rgba(239,83,80,0.5)' },
  codeInput:  { fontSize: 28, fontWeight: '900', letterSpacing: 12, color: colors.gold },
  codeHint:   { fontSize: 11, fontWeight: '600', color: colors.textFaint, textAlign: 'center' },

  strengthRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  strengthLabel:{ fontSize: 11, fontWeight: '700', color: colors.textFaint, minWidth: 50 },
  matchOk:      { fontSize: 12, fontWeight: '700', color: colors.green, marginTop: 4 },

  btnPrimary:     { backgroundColor: colors.gold, borderRadius: Radii.md, padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },

  resendBtn:  { alignItems: 'center', padding: 14, backgroundColor: colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.border },
  resendText: { fontSize: 14, fontWeight: '700', color: colors.textDim },
  cancelBtn:  { alignItems: 'center', padding: 10 },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.textFaint },
});
