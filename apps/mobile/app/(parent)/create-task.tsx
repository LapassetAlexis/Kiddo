import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tasksApi } from '@/lib/api/tasks';
import { childrenApi } from '@/lib/api/children';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { ApiError } from '@/lib/api-client';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { DIFFICULTY_LABELS, DIFFICULTY_EMOJI, XP_BY_DIFFICULTY, type TaskDifficulty } from '@/lib/rpg';

type Frequency = 'once' | 'daily' | 'weekly';

const DIFFICULTIES: TaskDifficulty[] = ['easy', 'medium', 'hard', 'very_hard', 'legendary'];

const QUICK_TASKS: { label: string; gold: number; difficulty: TaskDifficulty }[] = [
  { label: 'Faire ses devoirs',    gold: 50, difficulty: 'medium'    },
  { label: 'Ranger sa chambre',    gold: 30, difficulty: 'easy'      },
  { label: 'Mettre la table',      gold: 10, difficulty: 'easy'      },
  { label: 'Débarrasser',          gold: 10, difficulty: 'easy'      },
  { label: 'Faire la vaisselle',   gold: 10, difficulty: 'easy'      },
  { label: 'Passer l\'aspirateur', gold: 20, difficulty: 'medium'    },
  { label: 'Sortir les poubelles', gold: 15, difficulty: 'easy'      },
  { label: 'Faire son lit',        gold: 10, difficulty: 'easy'      },
];

const FREQ_OPTIONS: { value: Frequency; label: string; desc: string }[] = [
  { value: 'once',   label: 'Une fois',       desc: 'Quête ponctuelle' },
  { value: 'daily',  label: 'Chaque jour',    desc: 'Repart chaque matin' },
  { value: 'weekly', label: 'Chaque semaine', desc: 'Choisir le jour →' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CreateTaskScreen() {
  const [title, setTitle]             = useState('');
  const [gold, setGold]               = useState('');
  const [difficulty, setDifficulty]   = useState<TaskDifficulty>('easy');
  const [frequency, setFrequency]     = useState<Frequency>('daily');
  const [weekDay, setWeekDay]         = useState(0);
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [bonusGold, setBonusGold]     = useState('');
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const { config: modalCfg, show: showModal, hide: hideModal } = useAppModal();

  const { data: childrenData, loading: childrenLoading, error: childrenError, refresh: childrenRefresh } =
    useApiData(() => childrenApi.list(), []);

  useEffect(() => {
    if (childrenData) setAssignedIds(childrenData.map(c => c.id));
  }, [childrenData]);

  function toggleChild(id: string) {
    setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function applyQuick(q: typeof QUICK_TASKS[0]) {
    setTitle(q.label);
    setGold(String(q.gold));
    setDifficulty(q.difficulty);
  }

  async function submit() {
    if (!title.trim()) {
      showModal({ icon: '✏️', title: 'Titre requis', message: 'Donne un nom à la quête.' });
      return;
    }
    const goldAmt = parseInt(gold, 10);
    if (!goldAmt || goldAmt < 1 || goldAmt > 999) {
      showModal({ icon: '🪙', title: 'Récompense invalide', message: 'Entre un nombre entre 1 et 999.' });
      return;
    }
    if (assignedIds.length === 0) {
      showModal({ icon: '👶', title: 'Enfant requis', message: 'Assigne la quête à au moins un enfant.' });
      return;
    }

    setLoading(true);
    try {
      const bonus = parseInt(bonusGold, 10) || 0;
      await Promise.all(assignedIds.map(childId =>
        tasksApi.create({
          childId, title, goldReward: goldAmt, difficulty,
          frequency,
          weekDay: frequency === 'weekly' ? weekDay : undefined,
          timesPerDay: frequency === 'daily' ? timesPerDay : 1,
          bonusGold: frequency === 'daily' && timesPerDay > 1 ? bonus : 0,
        })
      ));
      const names = (childrenData ?? []).filter(c => assignedIds.includes(c.id)).map(c => c.name).join(' et ');
      showModal({
        icon: '📋',
        title: 'Quête créée !',
        message: `"${title}" (+${goldAmt}🪙 +${XP_BY_DIFFICULTY[difficulty]}⭐)\nassignée à ${names}.`,
        buttons: [{ label: 'Super !', style: 'default', onPress: () => router.back() }],
      });
    } catch (err) {
      showModal({ icon: '❌', title: 'Erreur', message: err instanceof ApiError ? err.message : 'Impossible de créer la tâche.' });
    } finally {
      setLoading(false);
    }
  }

  if (childrenLoading && !childrenData) return <LoadingScreen />;
  if (childrenError && !childrenData)   return <ErrorScreen message={childrenError} onRetry={childrenRefresh} />;

  const children = childrenData ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Nouvelle quête</Text>
          <TouchableOpacity onPress={submit} disabled={loading} style={[styles.saveBtn, loading && { opacity: 0.5 }]} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>{loading ? '…' : 'Créer'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Raccourcis */}
          <Text style={styles.sectionLabel}>Raccourcis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {QUICK_TASKS.map(q => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickChip, title === q.label && styles.quickChipActive]}
                onPress={() => applyQuick(q)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, title === q.label && styles.quickChipTextActive]}>{q.label}</Text>
                <Text style={[styles.quickChipPts, title === q.label && styles.quickChipTextActive]}>
                  {DIFFICULTY_EMOJI[q.difficulty]} +{q.gold}🪙
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nom */}
          <Text style={styles.sectionLabel}>Nom de la quête</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Ranger sa chambre"
            placeholderTextColor={Colors.textFaint}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={60}
          />

          {/* Difficulté */}
          <Text style={styles.sectionLabel}>Difficulté (XP gagné)</Text>
          <View style={styles.diffGroup}>
            {DIFFICULTIES.map(d => {
              const selected = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.diffOption, selected && styles.diffOptionActive]}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.diffEmoji}>{DIFFICULTY_EMOJI[d]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.diffLabel, selected && styles.diffLabelActive]}>{DIFFICULTY_LABELS[d]}</Text>
                  </View>
                  <Text style={[styles.diffXp, selected && styles.diffXpActive]}>+{XP_BY_DIFFICULTY[d]} ⭐</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Récompense en or */}
          <Text style={styles.sectionLabel}>Pièces d'or 🪙</Text>
          <View style={styles.ptsRow}>
            {[10, 20, 30, 50].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.ptsChip, gold === String(p) && styles.ptsChipActive]}
                onPress={() => setGold(String(p))}
                activeOpacity={0.7}
              >
                <Text style={[styles.ptsChipText, gold === String(p) && styles.ptsChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.ptsInput, !([10,20,30,50].map(String).includes(gold)) && gold !== '' && styles.ptsInputActive]}
              placeholder="Autre"
              placeholderTextColor={Colors.textFaint}
              value={[10,20,30,50].map(String).includes(gold) ? '' : gold}
              onChangeText={v => setGold(v.replace(/[^0-9]/g, ''))}
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
                <Text style={[styles.freqLabel, frequency === f.value && styles.freqLabelActive]}>{f.label}</Text>
                <Text style={styles.freqDesc}>
                  {f.value === 'weekly' && frequency === 'weekly' ? `Chaque ${DAYS[weekDay]}` : f.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === 'weekly' && (
            <View style={styles.dayPicker}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity key={day} style={[styles.dayBtn, weekDay === idx && styles.dayBtnActive]} onPress={() => setWeekDay(idx)} activeOpacity={0.7}>
                  <Text style={[styles.dayText, weekDay === idx && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {frequency === 'daily' && (
            <>
              <Text style={styles.sectionLabel}>Fois par jour</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={[styles.stepperBtn, timesPerDay <= 1 && styles.stepperBtnDisabled]} onPress={() => setTimesPerDay(v => Math.max(1, v - 1))} disabled={timesPerDay <= 1} activeOpacity={0.7}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperValueText}>{timesPerDay}×</Text>
                  <Text style={styles.stepperValueSub}>par jour</Text>
                </View>
                <TouchableOpacity style={[styles.stepperBtn, timesPerDay >= 10 && styles.stepperBtnDisabled]} onPress={() => setTimesPerDay(v => Math.min(10, v + 1))} disabled={timesPerDay >= 10} activeOpacity={0.7}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {frequency === 'daily' && timesPerDay > 1 && (
            <>
              <Text style={styles.sectionLabel}>Bonus or si tout complété 🪙</Text>
              <View style={styles.ptsRow}>
                {[5, 10, 15, 20].map(p => (
                  <TouchableOpacity key={p} style={[styles.ptsChip, bonusGold === String(p) && styles.ptsChipActive]} onPress={() => setBonusGold(String(p))} activeOpacity={0.7}>
                    <Text style={[styles.ptsChipText, bonusGold === String(p) && styles.ptsChipTextActive]}>+{p}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.ptsInput, !([5,10,15,20].map(String).includes(bonusGold)) && bonusGold !== '' && styles.ptsInputActive]}
                  placeholder="0"
                  placeholderTextColor={Colors.textFaint}
                  value={[5,10,15,20].map(String).includes(bonusGold) ? '' : bonusGold}
                  onChangeText={v => setBonusGold(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={3}
                  returnKeyType="done"
                />
              </View>
            </>
          )}

          {/* Assigner */}
          <Text style={styles.sectionLabel}>Assigner à</Text>
          <View style={styles.childrenGroup}>
            {children.map(child => {
              const selected = assignedIds.includes(child.id);
              return (
                <TouchableOpacity key={child.id} style={[styles.childOption, selected && styles.childOptionActive]} onPress={() => toggleChild(child.id)} activeOpacity={0.7}>
                  <Text style={styles.childEmoji}>{child.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.childName, selected && styles.childNameActive]}>{child.name}</Text>
                    <Text style={styles.childLevel}>{child.levelEmoji} Niv. {child.level}</Text>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Résumé */}
          {title.trim() && gold ? (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <Text style={styles.summaryLine}>📋 <Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{title}</Text></Text>
              <Text style={styles.summaryLine}>
                {DIFFICULTY_EMOJI[difficulty]} <Text style={{ color: Colors.textDim }}>{DIFFICULTY_LABELS[difficulty]}</Text>
                {'  ·  '}
                <Text style={{ color: Colors.gold, fontWeight: '900' }}>+{gold}🪙</Text>
                {'  ·  '}
                <Text style={{ color: Colors.textDim }}>+{XP_BY_DIFFICULTY[difficulty]}⭐</Text>
              </Text>
              <Text style={styles.summaryLine}>
                👶 {children.filter(c => assignedIds.includes(c.id)).map(c => `${c.avatar} ${c.name}`).join('  ') || '—'}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>{loading ? 'Création en cours…' : 'Créer la quête ✓'}</Text>
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
  saveBtn:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },

  quickScroll: { marginHorizontal: -Spacing.screen, paddingHorizontal: Spacing.screen },
  quickChip:       { backgroundColor: Colors.bgCard, borderRadius: Radii.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, alignItems: 'center' },
  quickChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  quickChipText:       { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  quickChipTextActive: { color: Colors.gold },
  quickChipPts:    { fontSize: 11, fontWeight: '900', color: Colors.textFaint, marginTop: 2 },

  input: { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: 16, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  // Difficulté
  diffGroup: { gap: 8 },
  diffOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  diffOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  diffEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  diffLabel:       { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  diffLabelActive: { color: Colors.gold },
  diffXp:          { fontSize: 13, fontWeight: '900', color: Colors.textFaint },
  diffXpActive:    { color: Colors.gold },

  // Or
  ptsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ptsChip:       { width: 56, height: 56, borderRadius: Radii.card, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  ptsChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  ptsChipText:       { fontSize: 16, fontWeight: '900', color: Colors.textDim },
  ptsChipTextActive: { color: Colors.gold },
  ptsInput:       { flex: 1, height: 56, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  ptsInputActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.08)' },

  // Fréquence
  freqGroup: { gap: 8 },
  freqOption:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  freqOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  freqLabel:       { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  freqLabelActive: { color: Colors.gold },
  freqDesc:        { fontSize: 12, fontWeight: '600', color: Colors.textFaint },

  dayPicker: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  dayBtn:       { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.35)' },
  dayText:       { fontSize: 12, fontWeight: '800', color: Colors.textFaint },
  dayTextActive: { color: Colors.gold },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn:         { width: 48, height: 48, borderRadius: Radii.card, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperBtnText:     { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  stepperValue:       { flex: 1, alignItems: 'center' },
  stepperValueText:   { fontSize: 22, fontWeight: '900', color: Colors.gold },
  stepperValueSub:    { fontSize: 11, fontWeight: '700', color: Colors.textFaint, marginTop: 1 },

  // Enfants
  childrenGroup: { gap: 8 },
  childOption:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  childOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  childEmoji: { fontSize: 26 },
  childName:       { fontSize: 15, fontWeight: '800', color: Colors.textDim },
  childNameActive: { color: Colors.textPrimary },
  childLevel:      { fontSize: 11, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },
  checkbox:       { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: Colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark:      { fontSize: 14, color: '#1a1000', fontWeight: '900' },

  summary: { backgroundColor: Colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 6 },
  summaryTitle: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryLine:  { fontSize: 14, fontWeight: '600', color: Colors.textDim },

  createBtn:     { backgroundColor: Colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1000' },
});
