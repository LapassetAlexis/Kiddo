import { View, Text, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';

const SECTIONS = [
  {
    title: "Aujourd'hui",
    data: [
      { id: '1', name: 'Ranger sa chambre',   type: 'earn', amount: 30,  meta: 'validé par Papa · 14h23' },
      { id: '2', name: 'Faire la vaisselle',   type: 'earn', amount: 10,  meta: 'validé par Papa · 9h05'  },
    ],
  },
  {
    title: 'Hier',
    data: [
      { id: '3', name: 'Soirée TV réclamée',  type: 'spend', amount: 50, meta: 'accordée par Maman · 20h11' },
      { id: '4', name: 'Faire ses devoirs',    type: 'earn',  amount: 50, meta: 'validé par Maman · 18h40'  },
      { id: '5', name: 'Mettre la table',      type: 'earn',  amount: 10, meta: 'validé par Papa · 12h30'   },
    ],
  },
];

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>Historique 📊</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Solde', value: '120', color: Colors.gold    },
          { label: 'Gagnés 7j', value: '+230', color: Colors.green  },
          { label: 'Dépensés', value: '−50', color: Colors.orange },
        ].map(s => (
          <View key={s.label} style={styles.stat}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.screen, gap: 4 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast  = index === section.data.length - 1;
          return (
            <View style={[
              styles.row,
              isFirst && styles.rowFirst,
              isLast  && styles.rowLast,
              !isFirst && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
            ]}>
              <View style={[styles.rowIcon, item.type === 'earn' ? styles.iconEarn : styles.iconSpend]}>
                <Text style={{ fontSize: 18 }}>{item.type === 'earn' ? '✅' : '🎁'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.meta}</Text>
              </View>
              <Text style={[styles.rowAmount, item.type === 'earn' ? { color: Colors.green } : { color: Colors.orange }]}>
                {item.type === 'earn' ? '+' : '−'}{item.amount} pts
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.bgScreen },
  title: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, padding: Spacing.screen, paddingBottom: 0 },

  statsRow: { flexDirection: 'row', gap: 10, padding: Spacing.screen, paddingBottom: 0 },
  stat:      { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 6 },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, padding: 13 },
  rowFirst: { borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card },
  rowLast:  { borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },
  rowIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEarn:  { backgroundColor: 'rgba(76,175,80,0.12)'  },
  iconSpend: { backgroundColor: 'rgba(255,107,53,0.10)' },
  rowName:   { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  rowMeta:   { fontSize: 11, fontWeight: '600', color: Colors.textFaint, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '900' },
});
