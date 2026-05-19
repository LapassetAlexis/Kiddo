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
