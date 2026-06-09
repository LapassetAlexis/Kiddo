export default {
  expo: {
    name: 'Kiddo',
    slug: 'kiddo',
    version: '0.1.13',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'kiddo',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#18181e',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'io.kiddo.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#18181e',
      },
      package: 'io.kiddo.app',
      versionCode: 13,
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    plugins: [
      '@react-native-google-signin/google-signin',
      'expo-router',
      'expo-secure-store',
      'expo-image-picker',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#FFB300',
          sounds: [],
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        "projectId": "d9538d87-60f5-4888-b1a7-b62d6f9a335f"
      },
    },
    owner: 'alapasset',
  },
};
