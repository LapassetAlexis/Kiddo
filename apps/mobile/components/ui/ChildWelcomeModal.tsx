import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Radii } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const key = (uid: string) => `@kiddo:welcome:${uid}`;

interface Props {
  userId: string;
  name: string;
  avatar: string;
  onDismiss?: () => void;
}

export default function ChildWelcomeModal({ userId, name, avatar, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(key(userId)).then(v => {
      if (!v) setVisible(true);
    });
  }, [userId]);

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  async function close() {
    Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      onDismiss?.();
      AsyncStorage.setItem(key(userId), '1');
    });
  }

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.avatar}>{avatar}</Text>
          <Text style={styles.title}>Bienvenue {name} ! 🎉</Text>
          <Text style={styles.desc}>
            {'Ton gardien te confie des quêtes.\nComplète-les pour gagner de l\'or 🪙\net débloque des récompenses au Magasin 🛒 !'}
          </Text>

          <View style={styles.loopRow}>
            <View style={styles.loopStep}>
              <Text style={styles.loopEmoji}>⚔️</Text>
              <Text style={styles.loopLabel}>Quête</Text>
            </View>
            <Text style={styles.loopArrow}>→</Text>
            <View style={styles.loopStep}>
              <Text style={styles.loopEmoji}>✅</Text>
              <Text style={styles.loopLabel}>Valider</Text>
            </View>
            <Text style={styles.loopArrow}>→</Text>
            <View style={styles.loopStep}>
              <Text style={styles.loopEmoji}>🪙</Text>
              <Text style={styles.loopLabel}>Or</Text>
            </View>
            <Text style={styles.loopArrow}>→</Text>
            <View style={styles.loopStep}>
              <Text style={styles.loopEmoji}>🎁</Text>
              <Text style={styles.loopLabel}>Récompense</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btn} onPress={close} activeOpacity={0.85}>
            <Text style={styles.btnText}>Commencer l'aventure ⚔️</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1e1e26',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  avatar:  { fontSize: 56 },
  title:   { fontSize: 22, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  desc:    { fontSize: 14, fontWeight: '600', color: colors.textDim, textAlign: 'center', lineHeight: 22 },

  loopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 },
  loopStep:  { alignItems: 'center', gap: 4 },
  loopEmoji: { fontSize: 22 },
  loopLabel: { fontSize: 10, fontWeight: '800', color: colors.textFaint },
  loopArrow: { fontSize: 14, color: colors.textFaint, marginBottom: 12 },

  btn:     { backgroundColor: colors.gold, borderRadius: Radii.pill, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  btnText: { fontSize: 15, fontWeight: '900', color: '#1a1000' },
});
