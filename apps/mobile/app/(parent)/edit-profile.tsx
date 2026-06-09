import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { familiesApi } from '@/lib/api/families';
import { ApiError } from '@/lib/api-client';

const AVATARS = ['👨','👩','👨‍👩‍👧','🧑','👱','👴','👵','🧔','👩‍🦰','👨‍🦳','🧑‍💼','👩‍💼'];

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { fontSize: 22, color: colors.textDim, fontWeight: '700', width: 40 },
  navTitle:    { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  saveBtn:     { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#1a1000' },

  content:    { padding: Spacing.screen, gap: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 44 },
  avatarHint: { position: 'absolute', bottom: 2, right: 4, fontSize: 10, color: colors.textFaint, fontWeight: '900' },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4 },
  card:         { backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
  fieldLabel:   { fontSize: 11, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 6 },
  input:        { fontSize: 16, fontWeight: '600', color: colors.textPrimary, paddingVertical: 4 },
  pwdBtn:     { backgroundColor: colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center' },
  pwdBtnText: { fontSize: 15, fontWeight: '800', color: colors.textDim },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet:   { backgroundColor: '#1e1e26', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  pickerHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16 },
  pickerTitle:   { fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 16 },
  pickerGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerItem:    { width: 54, height: 54, borderRadius: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pickerItemActive: { borderColor: colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },
  pickerEmoji:   { fontSize: 28 },
});

export default function EditProfileScreen() {
  const { bottom } = useSafeAreaInsets();
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [avatar,      setAvatar]      = useState('👩');
  const [avatarModal, setAvatarModal] = useState(false);
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    familiesApi.getMe()
      .then(p => {
        // Si name est null (anciens comptes), déduire depuis l'email
        const rawName = p.name?.trim() || p.email?.split('@')[0]?.replace(/[._-]/g, ' ') || '';
        const parts = rawName.split(' ').filter(Boolean);
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        setFirstName(parts[0] ? cap(parts[0]) : '');
        setLastName(parts.slice(1).map(cap).join(' '));
        setEmail(p.email ?? '');
      })
      .catch(() => {});
  }, []);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  async function saveProfile() {
    if (!firstName.trim()) {
      showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre ton prénom.' });
      return;
    }
    setLoading(true);
    try {
      await familiesApi.updateProfile({ name: fullName, email: email.trim().toLowerCase() });
      showModal({
        icon: '✅', title: 'Profil mis à jour',
        message: 'Tes informations ont bien été enregistrées.',
        buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }],
      });
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409 ? 'Cet email est déjà utilisé.' : 'Impossible de sauvegarder.';
      showModal({ icon: '❌', title: 'Erreur', message: msg });
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (!currentPwd) { showModal({ icon: '🔑', title: 'Mot de passe actuel requis', message: 'Saisis ton mot de passe actuel.' }); return; }
    if (newPwd.length < 8) { showModal({ icon: '🔒', title: 'Trop court', message: '8 caractères minimum.' }); return; }
    if (newPwd !== confirmPwd) { showModal({ icon: '❌', title: 'Mots de passe différents', message: 'Les deux mots de passe ne correspondent pas.' }); return; }
    setLoading(true);
    try {
      await familiesApi.changePassword(currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showModal({ icon: '✅', title: 'Mot de passe changé', message: '', buttons: [{ label: 'OK', style: 'default' }] });
    } catch { showModal({ icon: '❌', title: 'Mot de passe incorrect', message: 'Le mot de passe actuel est invalide.' }); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Mon profil</Text>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.5 }]} onPress={saveProfile} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? '…' : 'Enregistrer'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatar} onPress={() => setAvatarModal(true)} activeOpacity={0.75}>
              <Text style={styles.avatarText}>{avatar}</Text>
              <Text style={styles.avatarHint}>✎</Text>
            </TouchableOpacity>
          </View>

          {/* Informations */}
          <Text style={styles.sectionLabel}>Informations</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
              placeholder="Marie" placeholderTextColor={colors.textFaint}
              autoCapitalize="words" returnKeyType="next" />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
              placeholder="Dupont" placeholderTextColor={colors.textFaint}
              autoCapitalize="words" returnKeyType="next" />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="email@exemple.com" placeholderTextColor={colors.textFaint}
              keyboardType="email-address" autoCapitalize="none" returnKeyType="done" />
          </View>

          {/* Mot de passe */}
          <Text style={styles.sectionLabel}>Changer le mot de passe</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
            <TextInput style={styles.input} value={currentPwd} onChangeText={setCurrentPwd} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.textFaint} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="8 caractères minimum" placeholderTextColor={colors.textFaint} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Confirmer</Text>
            <TextInput style={styles.input} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholder="Répète le nouveau mot de passe" placeholderTextColor={colors.textFaint} />
          </View>

          <TouchableOpacity style={[styles.pwdBtn, loading && { opacity: 0.5 }]} onPress={changePassword} disabled={loading}>
            <Text style={styles.pwdBtnText}>Changer le mot de passe</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar picker */}
      <Modal visible={avatarModal} transparent animationType="slide" onRequestClose={() => setAvatarModal(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setAvatarModal(false)}>
          <Pressable style={[styles.pickerSheet, { paddingBottom: 40 + bottom }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Choisir un avatar</Text>
            <View style={styles.pickerGrid}>
              {AVATARS.map(a => (
                <TouchableOpacity key={a} style={[styles.pickerItem, avatar === a && styles.pickerItemActive]}
                  onPress={() => { setAvatar(a); setAvatarModal(false); }} activeOpacity={0.7}>
                  <Text style={styles.pickerEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}
