import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { useAuth } from '@/contexts/AuthContext';
import { childrenApi } from '@/lib/api/children';
import { familiesApi } from '@/lib/api/families';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';

export default function SettingsScreen() {
  const [notifTask,   setNotifTask]   = useState(true);
  const [notifReward, setNotifReward] = useState(true);
  const [notifStreak, setNotifStreak] = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();
  const { logout } = useAuth();

  const { data: profileData } = useApiData(() => familiesApi.getMe(), []);
  const { data: childrenData, loading: childrenLoading, error: childrenError, refresh: childrenRefresh } =
    useApiData(() => childrenApi.list(), []);

  function confirmLogout() {
    showModal({
      icon: '🚪',
      title: 'Se déconnecter ?',
      message: 'Tu devras te reconnecter avec ton email et ton mot de passe.',
      buttons: [
        { label: 'Se déconnecter', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  function confirmDeleteAccount() {
    showModal({
      icon: '⚠️',
      title: 'Supprimer le compte ?',
      message: 'Toutes les données (enfants, tâches, récompenses, points) seront définitivement supprimées. Cette action est irréversible.',
      buttons: [
        { label: 'Supprimer définitivement', style: 'destructive', onPress: () => {
          showModal({ icon: '✅', title: 'Compte supprimé', message: 'Toutes tes données ont été effacées.', buttons: [{ label: 'OK', style: 'default', onPress: () => router.replace('/(auth)/login') }] });
        }},
        { label: 'Annuler', style: 'cancel' },
      ],
    });
  }

  if (childrenLoading && !childrenData) return <LoadingScreen />;
  if (childrenError && !childrenData) return <ErrorScreen message={childrenError} onRetry={childrenRefresh} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres ⚙️</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profil parent */}
        <Text style={styles.sectionLabel}>Mon profil</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>👩</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Marie Dupont</Text>
              <Text style={styles.profileEmail}>marie.dupont@gmail.com</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(parent)/edit-profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enfants */}
        <Text style={styles.sectionLabel}>Mes enfants</Text>
        <View style={styles.card}>
          {(childrenData ?? []).map((child, i) => (
            <View key={child.id}>
              {i > 0 && <View style={styles.rowDivider} />}
              <View style={styles.childRow}>
                <View style={styles.childAvatar}>
                  <Text style={{ fontSize: 22 }}>{child.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childPts}>⭐ — pts</Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: '/(parent)/edit-child', params: { childId: child.id, childName: child.name, childEmoji: child.avatar } })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.addChildRow}
            onPress={() => router.push('/(parent)/create-child')}
            activeOpacity={0.7}
          >
            <Text style={styles.addChildText}>＋  Ajouter un enfant</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Tâche soumise"
            desc="Quand un enfant marque une tâche comme faite"
            value={notifTask}
            onToggle={setNotifTask}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            label="Récompense réclamée"
            desc="Quand un enfant réclame une récompense"
            value={notifReward}
            onToggle={setNotifReward}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            label="Série en danger 🔥"
            desc="Alerte si un enfant risque de perdre sa série en fin de journée"
            value={notifStreak}
            onToggle={setNotifStreak}
          />
        </View>

        {/* À propos */}
        <Text style={styles.sectionLabel}>À propos</Text>
        <View style={styles.card}>
          <InfoRow label="Version" value="0.1.0" />
          <View style={styles.rowDivider} />
          <InfoRow label="Environnement" value="Développement" />
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push({ pathname: '/(parent)/legal', params: { type: 'terms' } })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push({ pathname: '/(parent)/legal', params: { type: 'privacy' } })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Compte */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={confirmLogout} activeOpacity={0.7}>
            <Text style={styles.linkText}>Se déconnecter</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.linkRow} onPress={confirmDeleteAccount} activeOpacity={0.7}>
            <Text style={[styles.linkText, { color: '#EF5350' }]}>Supprimer le compte</Text>
            <Text style={[styles.linkArrow, { color: '#EF5350' }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}

function ToggleRow({ label, desc, value, onToggle }: {
  label: string; desc: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,184,0,0.4)' }}
        thumbColor={value ? Colors.gold : 'rgba(255,255,255,0.4)'}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },

  header: {
    paddingHorizontal: Spacing.screen, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },

  content: { padding: Spacing.screen, gap: 10 },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginTop: 8, marginBottom: 4,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },

  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  profileRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  profileAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText:{ fontSize: 28 },
  profileName:      { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  profileEmail:     { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  editBtn:     { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontSize: 12, fontWeight: '800', color: Colors.textDim },

  childRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  childAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,184,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  childName:   { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  childPts:    { fontSize: 12, fontWeight: '700', color: Colors.gold, marginTop: 2 },
  addChildRow: { padding: 16, alignItems: 'center' },
  addChildText:{ fontSize: 14, fontWeight: '800', color: Colors.textDim },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  toggleDesc:  { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.textFaint },

  linkRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  linkText:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  linkArrow: { fontSize: 20, color: Colors.textFaint, fontWeight: '300' },
});
