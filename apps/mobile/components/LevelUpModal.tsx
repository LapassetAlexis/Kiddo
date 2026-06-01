import { Modal, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors, Radii } from '@/constants/theme';
import { getLevelTitle } from '@/lib/rpg';
import type { ChildClass } from '@/lib/rpg';

const CLASS_MESSAGES: Record<ChildClass, string[]> = {
  warrior: ['Ton épée brille plus que jamais !', 'Les ennemis tremblent devant toi !', 'Un guerrier légendaire est né !'],
  archer:  ['Ta flèche vise toujours juste !', 'Ton arc est redoutable !', 'Archer des étoiles !'],
  mage:    ['Ta magie est plus puissante !', 'Les sorts coulent de ta baguette !', 'Mage des temps anciens !'],
  rogue:   ['Discret et redoutable !', 'Personne ne te voit venir !', 'Voleur légendaire !'],
  paladin: ['Ton bouclier protège tous !', 'La lumière guide tes pas !', 'Paladin divin !'],
};

const STAR_POSITIONS: Array<{ top: `${number}%`; left: `${number}%` }> = [
  { top: '38%', left: '12%' },
  { top: '18%', left: '48%' },
  { top: '52%', left: '78%' },
];

interface Props {
  visible: boolean;
  newLevel: number;
  childClass: ChildClass;
  childName: string;
  onClose: () => void;
}

export default function LevelUpModal({ visible, newLevel, childClass, childName, onClose }: Props) {
  const backdropOpacity = useSharedValue(0);
  const cardScale       = useSharedValue(0);
  const cardOpacity     = useSharedValue(0);
  const glowOpacity     = useSharedValue(0);
  const s1 = useSharedValue(0);
  const s2 = useSharedValue(0);
  const s3 = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      // Cancel any running animations then hard-reset
      [backdropOpacity, cardScale, cardOpacity, glowOpacity, s1, s2, s3].forEach(cancelAnimation);
      backdropOpacity.value = 0;
      cardScale.value       = 0;
      cardOpacity.value     = 0;
      glowOpacity.value     = 0;
      s1.value = 0; s2.value = 0; s3.value = 0;
      return;
    }

    // withDelay(16) = one frame gap so the initial render at scale=0 commits before animation starts
    backdropOpacity.value = withDelay(16, withTiming(1, { duration: 200 }));
    cardOpacity.value     = withDelay(16, withTiming(1, { duration: 180 }));
    cardScale.value       = withDelay(16, withSpring(1, { damping: 14, stiffness: 180 }));
    glowOpacity.value     = withDelay(220, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    s1.value = withDelay(320, withSpring(1, { damping: 12, stiffness: 200 }));
    s2.value = withDelay(420, withSpring(1, { damping: 12, stiffness: 200 }));
    s3.value = withDelay(520, withSpring(1, { damping: 12, stiffness: 200 }));
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle     = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ scale: cardScale.value }] }));
  const glowStyle     = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const s1Style = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }] }));
  const s2Style = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }] }));
  const s3Style = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }] }));
  const starStyles = [s1Style, s2Style, s3Style];

  const levelTitle = getLevelTitle(newLevel);
  const message    = CLASS_MESSAGES[childClass][(newLevel - 1) % CLASS_MESSAGES[childClass].length];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>

          {STAR_POSITIONS.map((pos, i) => (
            <Animated.Text key={i} style={[styles.star, pos, starStyles[i]]}>⭐</Animated.Text>
          ))}

          <Animated.View style={[styles.glowRing, glowStyle]} />

          <Text style={styles.badge}>NIVEAU SUPÉRIEUR !</Text>
          <Text style={styles.levelNum}>{newLevel}</Text>
          <Text style={styles.title}>{levelTitle}</Text>
          <Text style={styles.name}>{childName}, {message}</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnText}>Continuer l'aventure ⚔️</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#1e1b2e',
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255,184,0,0.4)',
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,184,0,0.07)',
  },
  star: {
    position: 'absolute',
    fontSize: 22,
  },
  badge: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  levelNum: {
    fontSize: 96,
    fontWeight: '900',
    color: Colors.gold,
    lineHeight: 100,
    letterSpacing: -4,
    textShadowColor: 'rgba(255,184,0,0.4)',
    textShadowRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.pill,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1400',
    letterSpacing: 0.2,
  },
});
