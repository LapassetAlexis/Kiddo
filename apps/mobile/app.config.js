export default {
  expo: {
    name: 'Kiddo',
    slug: 'kiddo',
    version: '0.1.0',
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
      bundleIdentifier: 'com.kiddo.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#18181e',
      },
      package: 'com.kiddo.app',
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-image-picker',
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
