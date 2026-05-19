export default {
  expo: {
    name: 'KidPoints',
    slug: 'kidpoints',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'kidpoints',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#18181e',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.kidpoints.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#18181e',
      },
      package: 'com.kidpoints.app',
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
        projectId: '65f463c6-06ef-4019-b84e-4a4be1bd4197',
      },
    },
    owner: 'alapasset',
  },
};
