import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Radii } from '@/constants/theme';

export default function ChildPinScreen() {
  const { name, fromParent } = useLocalSearchParams<{ name: string; fromParent?: string }>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function pressDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) validatePin(next);
  }

  function pressDelete() {
    setPin(p => p.slice(0, -1));
    setError(false);
  }

  async function validatePin(p: string) {
    // TODO: POST /auth/child/pin
    await new Promise(r => setTimeout(r, 400));
    if (p === '1234') { // demo PIN
      router.replace({ pathname: '/(child)/home', params: { fromParent } });
    } else {
      setPin('');
      setError(true);
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={styles.root}>
      <Text style={styles.greeting}>Bonjour, {name} ! 👋</Text>
      <Text style={styles.sub}>Tape ton code secret</Text>

      {/* Dots */}
      <View style={styles.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled, error && styles.dotError]} />
        ))}
      </View>
      {error && <Text style={styles.errorText}>Code incorrect — réessaie</Text>}

      {/* Numpad */}
      <View style={styles.numpad}>
        {KEYS.map((k, i) => k === '' ? (
          <View key={i} style={styles.keyEmpty} />
        ) : (
          <TouchableOpacity
            key={i}
            style={[styles.key, k === '⌫' && styles.keyDelete]}
            onPress={() => k === '⌫' ? pressDelete() : pressDigit(k)}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Changer d'enfant</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDim,
    marginTop: -16,
  },
  dots: {
    flexDirection: 'row',
    gap: 18,
    marginVertical: 8,
  },
  dot: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textFaint,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dotError: {
    borderColor: '#EF5350',
    backgroundColor: '#EF5350',
  },
  errorText: {
    color: '#EF5350',
    fontSize: 13,
    fontWeight: '700',
    marginTop: -12,
  },
  numpad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 84, height: 84,
    borderRadius: Radii.hero,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 84, height: 84,
  },
  keyDelete: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  keyDeleteText: {
    fontSize: 22,
    color: Colors.textDim,
  },
  back: {
    padding: 16,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDim,
  },
});
