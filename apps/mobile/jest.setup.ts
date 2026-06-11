// Setup global pour tous les tests Jest — exécuté AVANT le framework Jest
// (pas de beforeEach, describe, etc. disponibles ici)

// expo-secure-store : mock automatique via __mocks__/expo-secure-store.js
jest.mock('expo-secure-store');

// @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(() => Promise.resolve(null)),
  setItem:    jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove:jest.fn(() => Promise.resolve()),
  clear:      jest.fn(() => Promise.resolve()),
}));

// ThemeContext — dark palette stable pour tous les tests
const _mockColors = {
  bgScreen: '#18181e', bgCard: '#26262e', bgCardDone: '#1e2820', bgCardPending: '#262412',
  bgHero: '#25252d', bgStreak: '#22222a', bgNav: '#18181e',
  gold: '#FFB800', goldDim: 'rgba(255,184,0,0.5)', orange: '#FF7040',
  green: '#4CAF50', greenDim: '#66BB6A', red: '#EF5350',
  textPrimary: 'rgba(255,255,255,0.88)', textDim: 'rgba(255,255,255,0.40)',
  textFaint: 'rgba(255,255,255,0.22)', border: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(255,184,0,0.20)',
};
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ colors: _mockColors, preference: 'dark', setPreference: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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

jest.mock('expo-notifications', () => ({
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
}));
