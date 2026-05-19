import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={Colors.gold} />
    </View>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.msg}>{message}</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.btnText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#18181e', alignItems: 'center', justifyContent: 'center', gap: 16 },
  emoji:   { fontSize: 40 },
  msg:     { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 32 },
  btn:     { backgroundColor: '#FFB800', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontSize: 14, fontWeight: '900', color: '#1a1000' },
});
