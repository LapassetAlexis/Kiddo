import { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

export function useGoogleAuth(onToken: (idToken: string) => Promise<void>) {
  const [loading, setLoading] = useState(false);

  async function prompt() {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('No idToken');
      await onToken(idToken);
    } catch (err: any) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('Google sign-in error', err);
      }
    } finally {
      setLoading(false);
    }
  }

  return { prompt, loading, ready: true };
}
