import { Redirect } from 'expo-router';

// Entry point: redirect to auth
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
