import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Registered in Google Cloud Console → OAuth 2.0 Web Client → Authorized redirect URIs
const REDIRECT_URI = 'https://auth.expo.io/@alapasset/kiddo';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export function useGoogleAuth(onToken: (accessToken: string) => Promise<void>) {
  const [loading, setLoading] = useState(false);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri: REDIRECT_URI,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    { authorizationEndpoint: GOOGLE_AUTH_ENDPOINT },
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error' || response.type === 'dismiss') {
      setLoading(false);
      return;
    }
    if (response.type !== 'success') return;

    const accessToken = response.params?.access_token;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    onToken(accessToken).finally(() => setLoading(false));
  }, [response]);

  async function prompt() {
    if (!clientId) return;
    setLoading(true);
    await promptAsync();
  }

  return { prompt, loading, ready: !!request && !!clientId };
}
