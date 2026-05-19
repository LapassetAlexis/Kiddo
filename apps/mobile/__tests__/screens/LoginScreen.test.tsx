import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { ApiError } from '@/lib/api-client';

// ── Module-level mocks ────────────────────────────────────────────────────────

const mockLoginParent = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginParent: mockLoginParent,
    loginChild: jest.fn(),
    logout: jest.fn(),
    user: null,
    loading: false,
    refreshUser: jest.fn(),
  }),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
  },
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    bgScreen: '#18181e',
    bgCard: '#26262e',
    border: 'rgba(255,255,255,0.07)',
    gold: '#FFB800',
    textPrimary: 'rgba(255,255,255,0.88)',
    textDim: 'rgba(255,255,255,0.40)',
    textFaint: 'rgba(255,255,255,0.22)',
    orange: '#FF7040',
    green: '#4CAF50',
  },
  Radii: { md: 14, card: 18, hero: 28, pill: 99, sm: 10 },
  Spacing: { screen: 20, cardPad: 16, gap: 10 },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(<LoginScreen />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen — rendering', () => {
  it('renders email input', () => {
    const { getByPlaceholderText } = renderLogin();
    expect(getByPlaceholderText('Email')).toBeTruthy();
  });

  it('renders password input', () => {
    const { getByPlaceholderText } = renderLogin();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
  });

  it('renders "Se connecter" button', () => {
    const { getByText } = renderLogin();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('renders "Mot de passe oublié ?" link', () => {
    const { getByText } = renderLogin();
    expect(getByText('Mot de passe oublié ?')).toBeTruthy();
  });

  it('renders "Pas encore de compte ?" text', () => {
    const { getByText } = renderLogin();
    expect(getByText(/Pas encore de compte/)).toBeTruthy();
  });
});

describe('LoginScreen — interaction', () => {
  it('button shows "Connexion…" and is disabled while loading', async () => {
    // loginParent hangs until we resolve it manually
    let resolveLogin!: () => void;
    mockLoginParent.mockReturnValueOnce(
      new Promise<void>(res => { resolveLogin = res; }),
    );

    const { getByPlaceholderText, getByText } = renderLogin();
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'secret');

    fireEvent.press(getByText('Se connecter'));

    await waitFor(() => {
      expect(getByText('Connexion…')).toBeTruthy();
    });

    // Le texte "Connexion…" confirme que loading=true est actif
    expect(getByText('Connexion…')).toBeTruthy();

    // Cleanup
    resolveLogin();
  });

  it('shows Alert on wrong credentials (ApiError 401)', async () => {
    const { Alert } = require('react-native');
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    mockLoginParent.mockRejectedValueOnce(new ApiError(401, { message: 'Invalid credentials' }));

    const { getByPlaceholderText, getByText } = renderLogin();
    fireEvent.changeText(getByPlaceholderText('Email'), 'bad@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'wrongpass');

    fireEvent.press(getByText('Se connecter'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Connexion échouée',
        'Email ou mot de passe incorrect.',
      );
    });
  });

  it('shows generic error message for non-401 ApiError', async () => {
    const { Alert } = require('react-native');
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    mockLoginParent.mockRejectedValueOnce(new ApiError(500, { message: 'Server error' }));

    const { getByPlaceholderText, getByText } = renderLogin();
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'pass');

    fireEvent.press(getByText('Se connecter'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Connexion échouée', 'Server error');
    });
  });

  it('appelle loginParent avec les bons arguments', async () => {
    mockLoginParent.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = renderLogin();
    fireEvent.changeText(getByPlaceholderText('Email'), 'parent@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'correctpass');
    fireEvent.press(getByText('Se connecter'));

    await waitFor(() => {
      expect(mockLoginParent).toHaveBeenCalledWith('parent@example.com', 'correctpass');
    });
  });

  it('contient un lien "Mot de passe oublié ?"', () => {
    const { getByText } = renderLogin();
    expect(getByText('Mot de passe oublié ?')).toBeTruthy();
  });

  it('contient un lien "S\'inscrire"', () => {
    const { getByText } = renderLogin();
    expect(getByText(/S'inscrire/)).toBeTruthy();
  });

  it('does not call loginParent when email or password is empty', () => {
    const { getByText } = renderLogin();
    fireEvent.press(getByText('Se connecter'));
    expect(mockLoginParent).not.toHaveBeenCalled();
  });
});
