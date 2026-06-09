import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '';

export function useGoogleAuth(onToken: (accessToken: string) => Promise<void>) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     WEB_CLIENT_ID     || undefined,
    androidClientId: ANDROID_CLIENT_ID || undefined,
    iosClientId:     IOS_CLIENT_ID     || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error' || response.type === 'dismiss') {
      setLoading(false);
      return;
    }
    if (response.type !== 'success') return;

    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    onToken(accessToken).finally(() => setLoading(false));
  }, [response]);

  async function prompt() {
    setLoading(true);
    await promptAsync();
  }

  const hasClientId = !!(ANDROID_CLIENT_ID || IOS_CLIENT_ID || WEB_CLIENT_ID);

  return { prompt, loading, ready: !!request && hasClientId };
}
