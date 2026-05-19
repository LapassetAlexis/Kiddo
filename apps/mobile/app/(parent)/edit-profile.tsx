import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { familiesApi } from '@/lib/api/families';

export default function EditProfileScreen() {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  useEffect(() => {
    familiesApi.getMe().then(p => {
      setName(p.name ?? '');
      setEmail(p.email ?? '');
    }).catch(() => {});
  }, []);

  async function saveProfile() {
    if (!name.trim()) {
      showModal({ icon: '✏️', title: 'Nom requis', message: 'Entre ton prénom et ton nom.' });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    showModal({
      icon: '✅', title: 'Profil mis à jour',
      message: 'Tes informations ont bien été enregistrées.',
      buttons: [{ label: 'OK', style: 'default', onPress: () => router.navigate('/(parent)/settings') }],
    });
  }

  async function changePassword() {
    if (!currentPwd) {
      showModal({ icon: '🔑', title: 'Mot de passe actuel requis', message: 'Saisis ton mot de passe actuel.' });
      return;
    }
    if (newPwd.length < 8) {
      showModal({ icon: '🔒', title: 'Mot de passe trop court', message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      showModal({ icon: '❌', title: 'Mots de passe différents', message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    showModal({ icon: '✅', title: 'Mot de passe changé', message: 'Ton mot de passe a bien été mis à jour.', buttons: [{ label: 'OK', style: 'default' }] });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.navigate('/(parent)/settings')}>
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
            <View style={styles.avatar}><Text style={styles.avatarText}>👩</Text></View>
            <TouchableOpacity style={styles.avatarChange}>
              <Text style={styles.avatarChangeText}>Changer l'avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Infos */}
          <Text style={styles.sectionLabel}>Informations</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nom complet</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Prénom Nom" placeholderTextColor={Colors.textFaint} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemple.com" placeholderTextColor={Colors.textFaint} keyboardType="email-address" autoCapitalize="none" />
          </View>

          {/* Mot de passe */}
          <Text style={styles.sectionLabel}>Changer le mot de passe</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
            <TextInput style={styles.input} value={currentPwd} onChangeText={setCurrentPwd} secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.textFaint} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="8 caractères minimum" placeholderTextColor={Colors.textFaint} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>Confirmer</Text>
            <TextInput style={styles.input} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholder="Répète le nouveau mot de passe" placeholderTextColor={Colors.textFaint} />
          </View>

          <TouchableOpacity style={[styles.pwdBtn, loading && { opacity: 0.5 }]} onPress={changePassword} disabled={loading}>
            <Text style={styles.pwdBtnText}>Changer le mot de passe</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { fontSize: 22, color: Colors.textDim, fontWeight: '700', width: 40 },
  navTitle:    { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  saveBtn:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 12 },

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 44 },
  avatarChange:  { backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  avatarChangeText: { fontSize: 13, fontWeight: '700', color: Colors.textDim },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4 },
  card:         { backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 6 },
  fieldLabel:   { fontSize: 11, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 6 },
  input:        { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, paddingVertical: 4 },

  pwdBtn:     { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  pwdBtnText: { fontSize: 15, fontWeight: '800', color: Colors.textDim },
});
