import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useState, useEffect, useMemo } from 'react';
import AppModal, { useAppModal } from '@/components/ui/AppModal';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tasksApi } from '@/lib/api/tasks';
import { childrenApi } from '@/lib/api/children';
import { useApiData } from '@/lib/useApiData';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { ApiError } from '@/lib/api-client';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { fontSize: 22, color: colors.textDim, width: 40 },
  navTitle:    { fontSize: 16, color: colors.textPrimary },
  saveBtn:     { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 14, color: '#1a1000' },

  content: { padding: Spacing.screen, gap: 16 },
  sectionLabel: { fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.2 },

  quickScroll: { marginHorizontal: -Spacing.screen, paddingHorizontal: Spacing.screen },
  quickChip:       { backgroundColor: colors.bgCard, borderRadius: Radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, alignItems: 'center' },
  quickChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  quickChipText:       { fontSize: 13, color: colors.textDim },
  quickChipTextActive: { color: colors.gold },
  quickChipPts:    { fontSize: 11, color: colors.textFaint, marginTop: 2 },

  input: { backgroundColor: colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  // Difficulté
  diffGroup: { gap: 8 },
  diffOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 14 },
  diffOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  diffEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  diffLabel:       { fontSize: 15, color: colors.textDim },
  diffLabelActive: { color: colors.gold },
  diffXp:          { fontSize: 13, color: colors.textFaint },
  diffXpActive:    { color: colors.gold },

  // Or
  ptsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ptsChip:       { width: 56, height: 56, borderRadius: Radii.card, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  ptsChipActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.3)' },
  ptsChipText:       { fontSize: 16, color: colors.textDim },
  ptsChipTextActive: { color: colors.gold },
  ptsInput:       { flex: 1, height: 56, backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, textAlign: 'center', fontSize: 16, color: colors.textPrimary },
  ptsInputActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.08)' },

  // Fréquence
  freqGroup: { gap: 8 },
  freqOption:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 14 },
  freqOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  freqLabel:       { fontSize: 15, color: colors.textDim },
  freqLabelActive: { color: colors.gold },
  freqDesc:        { fontSize: 12, color: colors.textFaint },

  dayPicker: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  dayBtn:       { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: 'rgba(255,184,0,0.12)', borderColor: 'rgba(255,184,0,0.35)' },
  dayText:       { fontSize: 12, color: colors.textFaint },
  dayTextActive: { color: colors.gold },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn:         { width: 48, height: 48, borderRadius: Radii.card, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperBtnText:     { fontSize: 22, color: colors.textPrimary },
  stepperValue:       { flex: 1, alignItems: 'center' },
  stepperValueText:   { fontSize: 22, color: colors.gold },
  stepperValueSub:    { fontSize: 11, color: colors.textFaint, marginTop: 1 },

  // Enfants
  childrenGroup: { gap: 8 },
  childOption:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 14 },
  childOptionActive: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.06)' },
  childEmoji: { fontSize: 26 },
  childName:       { fontSize: 15, color: colors.textDim },
  childNameActive: { color: colors.textPrimary },
  childLevel:      { fontSize: 11, color: colors.textFaint, marginTop: 2 },
  checkbox:       { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  checkmark:      { fontSize: 14, color: '#1a1000' },

  summary: { backgroundColor: colors.bgCard, borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
  summaryTitle: { fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryLine:  { fontSize: 14, color: colors.textDim },

  createBtn:     { backgroundColor: colors.gold, borderRadius: Radii.md, padding: 18, alignItems: 'center' },
  createBtnText: { fontSize: 16, color: '#1a1000' },
});

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

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
            <PixelText style={styles.backBtn}>←</PixelText>
          </TouchableOpacity>
          <PixelText style={styles.navTitle}>Nouvelle quête</PixelText>
          <TouchableOpacity onPress={submit} disabled={loading} style={[styles.saveBtn, loading && { opacity: 0.5 }]} activeOpacity={0.8}>
            <PixelText style={styles.saveBtnText}>{loading ? '…' : 'Créer'}</PixelText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Raccourcis */}
          <PixelText style={styles.sectionLabel}>Raccourcis</PixelText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {QUICK_TASKS.map(q => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickChip, title === q.label && styles.quickChipActive]}
                onPress={() => applyQuick(q)}
                activeOpacity={0.7}
              >
                <PixelText style={[styles.quickChipText, title === q.label && styles.quickChipTextActive]}>{q.label}</PixelText>
                <PixelText style={[styles.quickChipPts, title === q.label && styles.quickChipTextActive]}>
                  {DIFFICULTY_EMOJI[q.difficulty]} +{q.gold}🪙
                </PixelText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nom */}
          <PixelText style={styles.sectionLabel}>Nom de la quête</PixelText>
          <TextInput
            style={styles.input}
            placeholder="Ex : Ranger sa chambre"
            placeholderTextColor={colors.textFaint}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={60}
          />

          {/* Difficulté */}
          <PixelText style={styles.sectionLabel}>Difficulté (XP gagné)</PixelText>
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
                  <PixelText style={styles.diffEmoji}>{DIFFICULTY_EMOJI[d]}</PixelText>
                  <View style={{ flex: 1 }}>
                    <PixelText style={[styles.diffLabel, selected && styles.diffLabelActive]}>{DIFFICULTY_LABELS[d]}</PixelText>
                  </View>
                  <PixelText style={[styles.diffXp, selected && styles.diffXpActive]}>+{XP_BY_DIFFICULTY[d]} ⭐</PixelText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Récompense en or */}
          <PixelText style={styles.sectionLabel}>Pièces d'or 🪙</PixelText>
          <View style={styles.ptsRow}>
            {[10, 20, 30, 50].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.ptsChip, gold === String(p) && styles.ptsChipActive]}
                onPress={() => setGold(String(p))}
                activeOpacity={0.7}
              >
                <PixelText style={[styles.ptsChipText, gold === String(p) && styles.ptsChipTextActive]}>{p}</PixelText>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.ptsInput, !([10,20,30,50].map(String).includes(gold)) && gold !== '' && styles.ptsInputActive]}
              placeholder="Autre"
              placeholderTextColor={colors.textFaint}
              value={[10,20,30,50].map(String).includes(gold) ? '' : gold}
              onChangeText={v => setGold(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="done"
            />
          </View>

          {/* Fréquence */}
          <PixelText style={styles.sectionLabel}>Fréquence</PixelText>
          <View style={styles.freqGroup}>
            {FREQ_OPTIONS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.freqOption, frequency === f.value && styles.freqOptionActive]}
                onPress={() => setFrequency(f.value)}
                activeOpacity={0.7}
              >
                <PixelText style={[styles.freqLabel, frequency === f.value && styles.freqLabelActive]}>{f.label}</PixelText>
                <PixelText style={styles.freqDesc}>
                  {f.value === 'weekly' && frequency === 'weekly' ? `Chaque ${DAYS[weekDay]}` : f.desc}
                </PixelText>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === 'weekly' && (
            <View style={styles.dayPicker}>
              {DAYS.map((day, idx) => (
                <TouchableOpacity key={day} style={[styles.dayBtn, weekDay === idx && styles.dayBtnActive]} onPress={() => setWeekDay(idx)} activeOpacity={0.7}>
                  <PixelText style={[styles.dayText, weekDay === idx && styles.dayTextActive]}>{day}</PixelText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {frequency === 'daily' && (
            <>
              <PixelText style={styles.sectionLabel}>Fois par jour</PixelText>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={[styles.stepperBtn, timesPerDay <= 1 && styles.stepperBtnDisabled]} onPress={() => setTimesPerDay(v => Math.max(1, v - 1))} disabled={timesPerDay <= 1} activeOpacity={0.7}>
                  <PixelText style={styles.stepperBtnText}>−</PixelText>
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <PixelText style={styles.stepperValueText}>{timesPerDay}×</PixelText>
                  <PixelText style={styles.stepperValueSub}>par jour</PixelText>
                </View>
                <TouchableOpacity style={[styles.stepperBtn, timesPerDay >= 10 && styles.stepperBtnDisabled]} onPress={() => setTimesPerDay(v => Math.min(10, v + 1))} disabled={timesPerDay >= 10} activeOpacity={0.7}>
                  <PixelText style={styles.stepperBtnText}>+</PixelText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {frequency === 'daily' && timesPerDay > 1 && (
            <>
              <PixelText style={styles.sectionLabel}>Bonus or si tout complété 🪙</PixelText>
              <View style={styles.ptsRow}>
                {[5, 10, 15, 20].map(p => (
                  <TouchableOpacity key={p} style={[styles.ptsChip, bonusGold === String(p) && styles.ptsChipActive]} onPress={() => setBonusGold(String(p))} activeOpacity={0.7}>
                    <PixelText style={[styles.ptsChipText, bonusGold === String(p) && styles.ptsChipTextActive]}>+{p}</PixelText>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.ptsInput, !([5,10,15,20].map(String).includes(bonusGold)) && bonusGold !== '' && styles.ptsInputActive]}
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
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
          <PixelText style={styles.sectionLabel}>Assigner à</PixelText>
          <View style={styles.childrenGroup}>
            {children.map(child => {
              const selected = assignedIds.includes(child.id);
              return (
                <TouchableOpacity key={child.id} style={[styles.childOption, selected && styles.childOptionActive]} onPress={() => toggleChild(child.id)} activeOpacity={0.7}>
                  <PixelText style={styles.childEmoji}>{child.avatar}</PixelText>
                  <View style={{ flex: 1 }}>
                    <PixelText style={[styles.childName, selected && styles.childNameActive]}>{child.name}</PixelText>
                    <PixelText style={styles.childLevel}>{child.levelEmoji} Niv. {child.level}</PixelText>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                    {selected && <PixelText style={styles.checkmark}>✓</PixelText>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Résumé */}
          {title.trim() && gold ? (
            <View style={styles.summary}>
              <PixelText style={styles.summaryTitle}>Récapitulatif</PixelText>
              <PixelText style={styles.summaryLine}>📋 <PixelText style={{ color: colors.textPrimary }}>{title}</PixelText></PixelText>
              <PixelText style={styles.summaryLine}>
                {DIFFICULTY_EMOJI[difficulty]} <PixelText style={{ color: colors.textDim }}>{DIFFICULTY_LABELS[difficulty]}</PixelText>
                {'  ·  '}
                <PixelText style={{ color: colors.gold }}>+{gold}🪙</PixelText>
                {'  ·  '}
                <PixelText style={{ color: colors.textDim }}>+{XP_BY_DIFFICULTY[difficulty]}⭐</PixelText>
              </PixelText>
              <PixelText style={styles.summaryLine}>
                👶 {children.filter(c => assignedIds.includes(c.id)).map(c => `${c.avatar} ${c.name}`).join('  ') || '—'}
              </PixelText>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <PixelText style={styles.createBtnText}>{loading ? 'Création en cours…' : 'Créer la quête ✓'}</PixelText>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <AppModal config={modalCfg} onHide={hideModal} />
    </SafeAreaView>
  );
}
