// Setup global pour tous les tests Jest — exécuté AVANT le framework Jest
// (pas de beforeEach, describe, etc. disponibles ici)

// expo-secure-store : mock automatique via __mocks__/expo-secure-store.js
jest.mock('expo-secure-store');

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync:       jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync:             jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync:                   jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

// expo-status-bar
jest.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));

// expo-constants (utilisé dans api-client pour détecter l'IP de Metro)
jest.mock('expo-constants', () => ({
  default: { expoConfig: { hostUri: 'localhost:8081' } },
  expoConfig: { hostUri: 'localhost:8081' },
}));

// registerForPushNotifications — contient un dynamic import qui crash dans Jest
jest.mock('@/lib/registerForPushNotifications', () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}));
