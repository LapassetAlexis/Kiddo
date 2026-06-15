import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import PixelText from '@/components/ui/PixelText';

export function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.root}>
      <PixelText style={styles.emoji}>😕</PixelText>
      <PixelText style={styles.msg}>{message}</PixelText>
      <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
        <PixelText style={styles.btnText}>Réessayer</PixelText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#18181e', alignItems: 'center', justifyContent: 'center', gap: 16 },
  emoji:   { fontSize: 40 },
  msg:     { fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 32 },
  btn:     { backgroundColor: '#FFB800', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontSize: 14, color: '#1a1000' },
});
