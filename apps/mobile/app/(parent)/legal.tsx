import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

const CONTENT = {
  terms: {
    title: "Conditions d'utilisation",
    sections: [
      {
        heading: '1. Acceptation des conditions',
        body: "En utilisant Kiddo, vous acceptez les présentes conditions d'utilisation. L'application est destinée aux familles pour la gestion des tâches quotidiennes des enfants.",
      },
      {
        heading: '2. Utilisation de l\'application',
        body: "Kiddo est un outil familial. Le compte parent est responsable de la gestion des profils enfants. L'application ne doit pas être utilisée à des fins commerciales.",
      },
      {
        heading: '3. Données personnelles',
        body: "Nous collectons uniquement les données nécessaires au fonctionnement de l'application : email, prénom des enfants, et historique des tâches. Aucune donnée n'est vendue à des tiers.",
      },
      {
        heading: '4. Responsabilité',
        body: "Kiddo est fourni \"tel quel\". Nous ne sommes pas responsables des décisions éducatives prises par les parents via l'application. Le système de points est purement symbolique.",
      },
      {
        heading: '5. Modification des conditions',
        body: "Nous nous réservons le droit de modifier ces conditions à tout moment. En cas de modification importante, vous serez notifié par email.",
      },
      {
        heading: '6. Contact',
        body: "Pour toute question concernant ces conditions : contact@kiddo.app",
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    sections: [
      {
        heading: '1. Données collectées',
        body: "Nous collectons : l'adresse email du parent, les prénoms des enfants, l'historique des tâches et des récompenses, et les paramètres de notifications.",
      },
      {
        heading: '2. Utilisation des données',
        body: "Vos données sont utilisées uniquement pour faire fonctionner Kiddo : synchroniser les tâches entre appareils, envoyer des notifications push, et afficher l'historique.",
      },
      {
        heading: '3. Stockage et sécurité',
        body: "Les données sont stockées sur des serveurs sécurisés (Railway, zone Europe). Les mots de passe sont hachés avec bcrypt. Les codes PIN des enfants sont hachés et jamais stockés en clair.",
      },
      {
        heading: '4. Partage des données',
        body: "Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Elles peuvent être partagées avec des prestataires techniques (hébergement, notifications push) dans le cadre strict du fonctionnement de l'app.",
      },
      {
        heading: '5. Vos droits',
        body: "Vous pouvez à tout moment demander la suppression de votre compte et de toutes les données associées depuis Paramètres → Supprimer le compte. Pour exercer vos droits RGPD : privacy@kiddo.app",
      },
      {
        heading: '6. Cookies et tracking',
        body: "Kiddo n'utilise pas de cookies de tracking ni de régies publicitaires. Aucune donnée de comportement n'est transmise à des tiers.",
      },
      {
        heading: '7. Enfants',
        body: "Les enfants n'ont pas de compte email. Seul le parent crée un compte. Les données des enfants sont rattachées au compte parent et gérées sous sa responsabilité.",
      },
    ],
  },
};

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: 'terms' | 'privacy' }>();
  const content = CONTENT[type ?? 'terms'];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.navigate('/(parent)/settings')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : mai 2026</Text>

        {content.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgScreen },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:  { fontSize: 22, color: Colors.textDim, fontWeight: '700', width: 40 },
  navTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary, flex: 1, textAlign: 'center' },

  content:    { padding: Spacing.screen, gap: 20 },
  lastUpdate: { fontSize: 12, fontWeight: '600', color: Colors.textFaint, marginBottom: 4 },

  section: { gap: 8 },
  heading: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  body:    { fontSize: 14, fontWeight: '500', color: Colors.textDim, lineHeight: 22 },
});
