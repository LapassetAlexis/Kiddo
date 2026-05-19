// Mock expo-secure-store avec stockage en mémoire
const _store = new Map();

module.exports = {
  getItemAsync: jest.fn((key) => Promise.resolve(_store.get(key) ?? null)),
  setItemAsync: jest.fn((key, value) => { _store.set(key, value); return Promise.resolve(); }),
  deleteItemAsync: jest.fn((key) => { _store.delete(key); return Promise.resolve(); }),
  _store,   // exposé pour les tests qui veulent vérifier le contenu
  _clear: () => _store.clear(),
};
