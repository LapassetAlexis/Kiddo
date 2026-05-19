import { Redirect } from 'expo-router';

// Expo Router gère les redirections auth depuis _layout.tsx via useSegments.
// Ici on redirige par défaut vers login ; _layout.tsx remplacera si un token est trouvé.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
