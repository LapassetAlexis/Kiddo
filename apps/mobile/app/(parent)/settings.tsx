import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgScreen, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>🚧</Text>
      <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textDim }}>À venir</Text>
    </View>
  );
}
