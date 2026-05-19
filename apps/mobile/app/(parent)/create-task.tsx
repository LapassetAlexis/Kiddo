import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';

type Frequency = 'once' | 'daily' | 'weekly';

const CHILDREN = [
  { id: '1', name: 'Lucas', emoji: '🦊' },
  { id: '2', name: 'Emma',  emoji: '🐻' },
];

const QUICK_TASKS = [
  { label: 'Faire ses devoirs',   pts: 50 },
  { label: 'Ranger sa chambre',   pts: 30 },
  { label: 'Mettre la table',     pts: 10 },
  { label: 'Débarrasser',         pts: 10 },
  { label: 'Faire la vaisselle',  pts: 10 },
  { label: 'Passer l\'aspirateur',pts: 20 },
  { label: 'Sortir les poubelles',pts: 15 },
  { label: 'Faire son lit',       pts: 10 },
];

const FREQ_OPTIONS: { value: Frequency; label: string; desc: string }[] = [
  { value: 'once',   label: 'Une fois',       desc: 'Tâche ponctuelle' },
  { value: 'daily',  label: 'Chaque jour',    desc: 'Repart chaque matin' },
  { value: 'weekly', label: 'Chaque semaine', desc: 'Choisir le jour →' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CreateTaskScreen() {
  const [title, setTitle]           = useState('');
  const [points, setPoints]         = useState('');
  const [frequency, setFrequency]   = useState<Frequency>('daily');
  const [weekDay, setWeekDay]       = useState(0); // 0=Lun … 6=Dim
  const [assignedIds, setAssignedIds] = useState<string[]>(CHILDREN.map(c => c.id));
  const [loading, setLoading]       = useState(false);

  function toggleChild(id: string) {
    setAssignedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function applyQuick(label: string, pts: number) {
    setTitle(label);
    setPoints(String(pts));
  }

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Donne un nom à la tâche.');
      return;
    }
    const pts = parseInt(points, 10);
    if (!pts || pts < 1 || pts > 999) {
      Alert.alert('Points invalides', 'Entre un nombre entre 1 et 999.');
      return;
    }
    if (assignedIds.length === 0) {
      Alert.alert('Enfant requis', 'Assigne la tâche à au moins un enfant.');
      return;
    }

    setLoading(true);
    // TODO: POST /tasks { title, points: pts, frequency, weekDay: frequency === 'weekly' ? weekDay : null, childIds: assignedIds }
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);

    const names = CHILDREN.filter(c => assignedIds.includes(c.id)).map(c => c.name).join(' et ');
    Alert.alert(
      'Tâche créée !',
      `"${title}" (+${pts} pts) assignée à ${names}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Nouvelle tâche</Text>
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[styles.saveBtn, loading && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{loading ? '…' : 'Créer'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Raccourcis */}
          <Text style={styles.sectionLabel}>Raccourcis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {QUICK_TASKS.map(q => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickChip, title === q.label && styles.quickChipActive]}
                onPress={() => applyQuick(q.label, q.pts)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, title === q.label && styles.quickChipTextActive]}>
                  {q.label}
                </Text>
                <Text style={[styles.quickChipPts, title === q.label && styles.quickChipTextActive]}>
                  +{q.pts} pts
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nom */}
          <Text style={styles.sectionLabel}>Nom de la tâche</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Ranger sa chambre"
            placeholderTextColor={Colors.textFaint}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={60}
          />

          {/* Points */}
          <Text style={styles.sectionLabel}>Points à gagner</Text>
          <View style={styles.ptsRow}>
            {[10, 20, 30, 50].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.ptsChip, points === String(p) && styles.ptsChipActive]}
                onPress={() => setPoints(String(p))}
                activeOpacity={0.7}
              >
                <Text style={[styles.ptsChipText, points === String(p) && styles.ptsChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.ptsInput, !([10,20,30,50].map(String).includes(points)) && points !== '' && styles.ptsInputActive]}
              placeholder="Autre"
              placeholderTextColor={Colors.textFaint}
              value={[10,20,30,50].map(String).includes(points) ? '' : points}
              onChangeText={v => setPoints(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="done"
            />
          </View>

          {/* Fréquence */}
          <Text style={styles.sectionLabel}>Fréquence</Text>
          <View style={styles.freqGroup}>
            {FREQ_OPTIONS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.freqOption, frequency === f.value && styles.freqOptionActive]}
                onPress={() => setFrequency(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.freqLabel, frequency === f.value && styles.freqLabelActive]}>
                  {f.label}
                </Text>
                <Text style={styles.freqDesc}>
                  {f.value === 'weekly' && frequency === 'weekly'
                    ? `Chaque ${DAYS[weekDay]}`
                    : f.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sélecteur de jour (visible uniquement en mode hebdomadaire) */}
          {frequency === 'weekly' && (
            <View style={styles.dayPicker}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayBtn, weekDay === idx && styles.dayBtnActive]}
                  onPress={() => setWeekDay(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, weekDay === idx && styles.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Assigner aux enfants */}
          <Text style={styles.sectionLabel}>Assigner à</Text>
          <View style={styles.childrenGroup}>
            {CHILDREN.map(child => {
              const selected = assignedIds.includes(child.id);
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childOption, selected && styles.childOptionActive]}
                  onPress={() => toggleChild(child.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.childEmoji}>{child.emoji}</Text>
                  <Text style={[styles.childName, selected && styles.childNameActive]}>
                    {child.name}
                  </Text>
                  <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Résumé */}
          {title.trim() && points ? (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <Text style={styles.summaryLine}>
                📋 <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{title}</Text>
              </Text>
              <Text style={styles.summaryLine}>
                ⭐ <Text style={{ color: Colors.gold, fontWeight: '900' }}>+{points} pts</Text>
                {'  ·  '}
                <Text style={{ color: Colors.textDim }}>
                  {frequency === 'weekly'
                    ? `Chaque ${DAYS[weekDay]}`
                    : FREQ_OPTIONS.find(f => f.value === frequency)?.label}
                </Text>
              </Text>
              <Text style={styles.summaryLine}>
                👶 {CHILDREN.filter(c => assignedIds.includes(c.id)).map(c => `${c.emoji} ${c.name}`).join('  ') || '—'}
              </Text>
            </View>
          ) : null}

          {/* Bouton principal */}
          <TouchableOpacity
            style={[styles.createBtn, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>
              {loading ? 'Création en cours…' : 'Créer la tâche ✓'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn:     { fontSize: 22, color: Colors.textDim, fontWeight: '700', width: 40 },
  navTitle:    { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  saveBtn:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },

  // Raccourcis
  quickScroll: { marginHorizontal: -Spacing.screen, paddingHorizontal: Spacing.screen },
  quickChip: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.pill,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10, marginRight: 8,
    alignItems: 'center',
  },
  quickChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  quickChipText:       { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  quickChipTextActive: { color: Colors.gold },
  quickChipPts:    { fontSize: 11, fontWeight: '900', color: Colors.textFaint, marginTop: 2 },

  // Inputs
  input: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
  },

  // Points
  ptsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ptsChip: {
    width: 56, height: 56, borderRadius: Radii.card,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ptsChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  ptsChipText:       { fontSize: 16, fontWeight: '900', color: Colors.textDim },
  ptsChipTextActive: { color: Colors.gold },
  ptsInput: {
    flex: 1, height: 56, backgroundColor: Colors.bgCard,
    borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border,
    textAlign: 'center', fontSize: 16, fontWeight: '900', color: Colors.textPrimary,
  },
  ptsInputActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.08)' },

  // Fréquence
  freqGroup: { gap: 8 },
  freqOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  freqOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  freqLabel:       { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  freqLabelActive: { color: Colors.gold },
  freqDesc:        { fontSize: 12, fontWeight: '600', color: Colors.textFaint },

  // Enfants
  childrenGroup: { gap: 8 },
  childOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  childOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  childEmoji: { fontSize: 26 },
  childName:       { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textDim },
  childNameActive: { color: Colors.textPrimary },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.textFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark: { fontSize: 14, color: '#1a1000', fontWeight: '900' },

  // Résumé
  summary: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.card,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 6,
  },
  summaryTitle: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryLine:  { fontSize: 14, fontWeight: '600', color: Colors.textDim },

  // Sélecteur de jour
  dayPicker: {
    flexDirection: 'row', gap: 6, justifyContent: 'space-between',
  },
  dayBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dayBtnActive: {
    backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.35)',
  },
  dayText:       { fontSize: 12, fontWeight: '800', color: Colors.textFaint },
  dayTextActive: { color: Colors.gold },

  // Bouton créer
  createBtn: {
    backgroundColor: Colors.gold, borderRadius: Radii.md,
    padding: 18, alignItems: 'center',
  },
  createBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },
});
