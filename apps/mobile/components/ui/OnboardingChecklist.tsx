import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { tasksApi } from '@/lib/api/tasks';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';

const STORAGE_KEY = '@kiddo:onboarding:done';

const CONFETTI = ['🎉', '⭐', '✨', '🌟', '🎊', '🏆'];
const CONFETTI_X: Array<`${number}%`> = ['8%', '20%', '33%', '47%', '62%', '76%'];

interface Props {
  childrenCount: number;
}

interface Step {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
  route?: string;
  cta?: string;
}

export default function OnboardingChecklist({ childrenCount }: Props) {
  const [visible, setVisible]           = useState(false);
  const [hasTask, setHasTask]           = useState(false);
  const [hasReward, setHasReward]       = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [hasGoal, setHasGoal]           = useState(false);
  const [celebrated, setCelebrated]     = useState(false);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const celebScale   = useRef(new Animated.Value(0)).current;
  const ptclYs       = useRef(CONFETTI.map(() => new Animated.Value(0))).current;
  const ptclOpacities= useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => { if (!v) setVisible(true); });
  }, []);

  useEffect(() => {
    if (!visible) return;
    tasksApi.history().then(tasks => {
      setHasTask(tasks.length > 0);
      setHasValidated(tasks.some(t => t.status === 'validated'));
    }).catch(() => {});
    rewardsApi.list().then(list => {
      setHasReward(list.length > 0);
    }).catch(() => {});
    childrenApi.list().then(children => {
      if (!children.length) return;
      Promise.all(children.map(c => childrenApi.get(c.id))).then(stats => {
        setHasGoal(stats.some(s => s.levelGoal != null));
      }).catch(() => {});
    }).catch(() => {});
  }, [visible]);

  async function dismiss() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, '1');
    });
  }

  const steps: Step[] = [
    { id: 'child',    label: 'Ajouter un enfant',              done: childrenCount > 0, route: '/(parent)/create-child',  cta: 'Ajouter' },
    { id: 'task',     label: 'Créer une première quête',       done: hasTask,           route: '/(parent)/create-task',   cta: 'Créer' },
    { id: 'reward',   label: 'Créer une première récompense',  done: hasReward,         route: '/(parent)/create-reward', cta: 'Créer' },
    { id: 'validate', label: 'Valider une quête enfant',       done: hasValidated,      route: undefined,                 cta: undefined },
    { id: 'goal',     label: "Fixer un objectif à un enfant", hint: "Paramètres → Modifier l'enfant → Objectif de niveau", done: hasGoal, route: '/(parent)/settings', cta: 'Aller' },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === steps.length;

  useEffect(() => {
    if (!allDone || !visible || celebrated) return;
    setCelebrated(true);

    // Banner springs in
    Animated.spring(celebScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();

    // Confetti particles burst up then fade
    ptclYs.forEach(a => a.setValue(0));
    ptclOpacities.forEach(a => a.setValue(1));
    Animated.stagger(70, CONFETTI.map((_, i) =>
      Animated.parallel([
        Animated.timing(ptclYs[i], { toValue: -(70 + i * 12), duration: 900, useNativeDriver: true }),
        Animated.timing(ptclOpacities[i], { toValue: 0, duration: 700, delay: 300, useNativeDriver: true }),
      ])
    )).start();

    // Auto-dismiss after celebration
    const t = setTimeout(dismiss, 2200);
    return () => clearTimeout(t);
  }, [allDone, visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Premiers pas 🚀</Text>
          <Text style={styles.sub}>{doneCount}/{steps.length} étapes complétées</Text>
        </View>
        {!allDone && (
          <TouchableOpacity onPress={dismiss} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(doneCount / steps.length) * 100}%` }]} />
      </View>

      {steps.map((step, i) => (
        <View key={step.id} style={[styles.row, i < steps.length - 1 && styles.rowBorder]}>
          <View style={[styles.checkbox, step.done && styles.checkboxDone]}>
            {step.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, step.done && styles.labelDone]}>{step.label}</Text>
            {step.hint && !step.done && (
              <Text style={styles.hint}>{step.hint}</Text>
            )}
          </View>
          {!step.done && step.route && (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push(step.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>{step.cta} →</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {allDone && (
        <View style={styles.celebrationZone}>
          {CONFETTI.map((emoji, i) => (
            <Animated.Text
              key={i}
              pointerEvents="none"
              style={[styles.particle, {
                left: CONFETTI_X[i],
                opacity: ptclOpacities[i],
                transform: [{ translateY: ptclYs[i] }],
              }]}
            >
              {emoji}
            </Animated.Text>
          ))}
          <Animated.View style={[styles.allDoneBanner, { transform: [{ scale: celebScale }] }]}>
            <Text style={styles.allDoneText}>🎉 Tout est prêt — tu maîtrises Kiddo !</Text>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.screen,
    marginBottom: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
    overflow: 'visible',
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  title:    { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  sub:      { fontSize: 11, fontWeight: '700', color: Colors.textFaint, marginTop: 2 },
  skipBtn:  { paddingHorizontal: 10, paddingVertical: 6 },
  skipText: { fontSize: 12, fontWeight: '700', color: Colors.textDim },

  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, borderRadius: 99, marginBottom: 10, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 99, backgroundColor: Colors.gold },

  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },

  checkbox:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkmark:    { fontSize: 12, fontWeight: '900', color: '#fff' },

  label:     { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  labelDone: { color: Colors.textFaint, textDecorationLine: 'line-through' },

  hint:    { fontSize: 10, fontWeight: '600', color: Colors.textFaint, marginTop: 1 },

  ctaBtn:  { backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' },
  ctaText: { fontSize: 11, fontWeight: '900', color: Colors.gold },

  celebrationZone: { position: 'relative', marginHorizontal: 12, marginTop: 4, marginBottom: 12, height: 80 },
  particle:        { position: 'absolute', bottom: 12, fontSize: 20 },

  allDoneBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(76,175,80,0.12)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)', alignItems: 'center' },
  allDoneText:   { fontSize: 13, fontWeight: '800', color: Colors.green },
});
