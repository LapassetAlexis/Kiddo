/**
 * Tests unitaires pour lib/useTour.ts
 * AsyncStorage : mocké manuellement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTour } from '@/lib/useTour';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSetItem.mockResolvedValue(undefined);
});

describe('useTour — état initial', () => {
  it('checked démarre à false avant la résolution de AsyncStorage', () => {
    mockGetItem.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useTour('onboarding'));
    expect(result.current.checked).toBe(false);
  });

  it('active démarre à false avant la résolution de AsyncStorage', () => {
    mockGetItem.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTour('onboarding'));
    expect(result.current.active).toBe(false);
  });
});

describe('useTour — après résolution de AsyncStorage', () => {
  it('checked passe à true après résolution de AsyncStorage', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.checked).toBe(true));
  });

  it('active devient true quand AsyncStorage retourne null', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.active).toBe(true));
  });

  it('active devient true quand AsyncStorage retourne undefined', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.active).toBe(true));
  });

  it('active reste false quand AsyncStorage retourne "1"', async () => {
    mockGetItem.mockResolvedValue('1');
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.active).toBe(false);
  });
});

describe('useTour — clé de stockage', () => {
  it('utilise la clé @kiddo:tour:${key} pour lire le stockage', async () => {
    mockGetItem.mockResolvedValue(null);
    renderHook(() => useTour('profile'));
    await waitFor(() => expect(mockGetItem).toHaveBeenCalledWith('@kiddo:tour:profile'));
  });

  it('deux clés différentes interrogent deux entrées indépendantes', async () => {
    mockGetItem.mockResolvedValue(null);
    renderHook(() => useTour('intro'));
    renderHook(() => useTour('settings'));
    await waitFor(() => expect(mockGetItem).toHaveBeenCalledTimes(2));
    expect(mockGetItem).toHaveBeenCalledWith('@kiddo:tour:intro');
    expect(mockGetItem).toHaveBeenCalledWith('@kiddo:tour:settings');
  });

  it('deux clés ont un état active indépendant', async () => {
    mockGetItem
      .mockResolvedValueOnce(null) // intro → active
      .mockResolvedValueOnce('1'); // settings → not active
    const { result: intro } = renderHook(() => useTour('intro'));
    const { result: settings } = renderHook(() => useTour('settings'));
    await waitFor(() => expect(intro.current.checked).toBe(true));
    await waitFor(() => expect(settings.current.checked).toBe(true));
    expect(intro.current.active).toBe(true);
    expect(settings.current.active).toBe(false);
  });
});

describe('useTour — finish()', () => {
  it('finish() met active à false', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.active).toBe(true));
    await act(async () => {
      await result.current.finish();
    });
    expect(result.current.active).toBe(false);
  });

  it('finish() appelle AsyncStorage.setItem avec la bonne clé et la valeur "1"', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTour('onboarding'));
    await waitFor(() => expect(result.current.active).toBe(true));
    await act(async () => {
      await result.current.finish();
    });
    expect(mockSetItem).toHaveBeenCalledWith('@kiddo:tour:onboarding', '1');
  });

  it('finish() utilise la clé correcte pour une clé personnalisée', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useTour('profile-tour'));
    await waitFor(() => expect(result.current.active).toBe(true));
    await act(async () => {
      await result.current.finish();
    });
    expect(mockSetItem).toHaveBeenCalledWith('@kiddo:tour:profile-tour', '1');
  });
});
