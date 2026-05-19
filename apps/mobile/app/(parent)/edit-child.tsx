import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { childrenApi } from '@/lib/api/children';

const AVATARS = ['🦊','🐻','🐼','🐨','🦁','🐯','🐸','🐙','🦄','🐶','🐱','🐰'];

export default function EditChildScreen() {
  const { childId, childName, childEmoji } = useLocalSearchParams<{
    childId: string; childName: string; childEmoji: string;
  }>();

  const [name,    setName]    = useState(childName ?? '');
  const [emoji,   setEmoji]   = useState(childEmoji ?? '🦊');
  const [pinMode, setPinMode] = useState(false);
  const [newPin,  setNewPin]  = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  async function save() {
    if (!name.trim()) { showModal({ icon: '✏️', title: 'Prénom requis', message: 'Entre le prénom de l\'enfant.' }); return; }
    setLoading(true);
    try {
      await childrenApi.update(childId, { name: name.trim(), avatar: emoji });
      showModal({ icon: '✅', title: 'Profil mis à jour', message: `Le profil de ${name} a été enregistré.`, buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de sauvegarder. Réessaie.' });
    } finally {
      setLoading(false);
    }
  }

  async function resetPin() {
    if (newPin.length < 4) { showModal({ icon: '🔢', title: 'Code trop court', message: 'Le code doit faire 4 chiffres.' }); return; }
    if (newPin !== confirm) { showModal({ icon: '❌', title: 'Codes différents', message: 'Les deux codes ne correspondent pas.', buttons: [{ label: 'Réessayer', style: 'default', onPress: () => { setConfirm(''); } }] }); return; }
    setLoading(true);
    try {
      await childrenApi.resetPin(childId, newPin);
      setNewPin(''); setConfirm(''); setPinMode(false);
      showModal({ icon: '✅', title: 'Code changé', message: `Le code secret de ${name} a été mis à jour.`, buttons: [{ label: 'OK', style: 'default' }] });
    } catch {
      showModal({ icon: '❌', title: 'Erreur', message: 'Impossible de changer le code. Réessaie.' });
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    showModal({
      icon: '⚠️', title: `Supprimer ${name} ?`,
      message: `Toutes les tâches, récompenses et points de ${name} seront définitivement supprimés.`,
      buttons: [
        { label: `Supprimer ${name}`, style: 'destructive', onPress: () => {
          showModal({ icon: '✅', title: 'Profil supprimé', message: `Le profil de ${name} a été supprimé.`, buttons: [{ label: 'OK', style: 'default', onPress: () => router.back() }] });
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => pinMode ? setPinMode(false) : router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{pinMode ? 'Nouveau code' : `Modifier ${name}`}</Text>
          {!pinMode && (
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.5 }]} onPress={save} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? '…' : 'Enregistrer'}</Text>
            </TouchableOpacity>
          )}
          {pinMode && <View style={{ width: 80 }} />}
        </View>

        {!pinMode ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Avatar preview */}
            <View style={styles.avatarSection}>
              <Text style={styles.bigEmoji}>{emoji}</Text>
              <Text style={styles.childNameDisplay}>{name}</Text>
            </View>

            {/* Prénom */}
            <Text style={styles.sectionLabel}>Prénom</Text>
            <View style={styles.card}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Prénom de l'enfant" placeholderTextColor={Colors.textFaint} />
            </View>

            {/* Avatar */}
            <Text style={styles.sectionLabel}>Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map(a => (
                <TouchableOpacity key={a} style={[styles.avatarOption, emoji === a && styles.avatarSelected]} onPress={() => setEmoji(a)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 28 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <Text style={styles.sectionLabel}>Sécurité</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => setPinMode(true)} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>🔢</Text>
              <Text style={styles.actionText}>Changer le code secret</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Zone danger</Text>
            <TouchableOpacity style={styles.deleteRow} onPress={confirmDelete} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, { color: '#EF5350' }]}>Supprimer le profil</Text>
              <Text style={[styles.actionArrow, { color: '#EF5350' }]}>›</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        ) : (
          /* PIN reset mode */
          <View style={styles.pinContent}>
            <Text style={styles.pinTitle}>Nouveau code pour {name}</Text>
            <Text style={styles.pinSub}>4 chiffres que {name} devra entrer</Text>
            <Text style={styles.bigEmoji}>{emoji}</Text>

            {/* Étape */}
            <Text style={styles.pinStep}>{newPin.length < 4 ? 'Nouveau code' : 'Confirme le code'}</Text>
            <View style={styles.dots}>
              {[0,1,2,3].map(i => {
                const current = newPin.length < 4 ? newPin : confirm;
                return <View key={i} style={[styles.dot, current.length > i && styles.dotFilled]} />;
              })}
            </View>

            <View style={styles.numpad}>
              {KEYS.map((k, i) => k === '' ? <View key={i} style={styles.keyEmpty} /> : (
                <TouchableOpacity key={i} style={[styles.key, k === '⌫' && styles.keyDelete]}
                  onPress={() => {
                    if (k === '⌫') {
                      if (newPin.length < 4) setNewPin(p => p.slice(0,-1));
                      else setConfirm(p => p.slice(0,-1));
                    } else {
                      if (newPin.length < 4) setNewPin(p => p + k);
                      else if (confirm.length < 4) setConfirm(p => p + k);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {newPin.length === 4 && confirm.length === 4 && (
              <TouchableOpacity style={[styles.saveBtn, { width: '100%', alignItems: 'center', padding: 16, borderRadius: Radii.md }, loading && { opacity: 0.5 }]} onPress={resetPin} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Enregistrement…' : 'Valider le nouveau code'}</Text>
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
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { fontSize: 22, color: Colors.textDim, fontWeight: '700', width: 40 },
  navTitle:    { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  saveBtn:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 12 },

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  bigEmoji:      { fontSize: 64 },
  childNameDisplay: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4 },
  card:         { backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  input:        { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  avatarGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarOption:  { width: 58, height: 58, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarSelected:{ borderColor: Colors.gold, backgroundColor: 'rgba(255,184,0,0.1)' },

  actionRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  deleteRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(239,83,80,0.06)', borderRadius: Radii.card, borderWidth: 1, borderColor: 'rgba(239,83,80,0.18)', padding: 16 },
  actionIcon: { fontSize: 22 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionArrow:{ fontSize: 20, color: Colors.textFaint },

  pinContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  pinTitle:   { fontSize: 18, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  pinSub:     { fontSize: 13, fontWeight: '600', color: Colors.textDim, textAlign: 'center', marginTop: -8 },
  pinStep:    { fontSize: 14, fontWeight: '800', color: Colors.textDim },
  dots:       { flexDirection: 'row', gap: 16 },
  dot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textFaint },
  dotFilled:  { backgroundColor: Colors.gold, borderColor: Colors.gold },
  numpad:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  key:        { width: 82, height: 82, borderRadius: 41, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:   { width: 82, height: 82 },
  keyDelete:  { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText:       { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  keyDeleteText: { fontSize: 22, color: Colors.textDim },
});
