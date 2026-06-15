import { useEffect, useRef, useMemo } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import type { ThemeColors } from '@/constants/theme';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import PixelText from '@/components/ui/PixelText';

export default function WakeUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pulse  = useRef(new Animated.Value(1)).current;
  const dot1   = useRef(new Animated.Value(0.3)).current;
  const dot2   = useRef(new Animated.Value(0.3)).current;
  const dot3   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    const dotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

    Animated.parallel([
      dotAnim(dot1, 0),
      dotAnim(dot2, 300),
      dotAnim(dot3, 600),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <PixelText style={styles.title}>Kiddo</PixelText>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>

      <PixelText style={styles.hint}>Le serveur se réveille…</PixelText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 28,
  },
  title: {
    fontFamily: Fonts.pixelBold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: colors.gold,
  },
  hint: {
    fontFamily: Fonts.pixel,
    fontSize: 16,
    color: colors.textFaint,
    marginTop: -8,
  },
});
