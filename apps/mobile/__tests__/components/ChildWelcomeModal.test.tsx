import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChildWelcomeModal from '@/components/ui/ChildWelcomeModal';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/constants/theme', () => ({
  Colors: {
    orange: '#FF7040',
    textPrimary: 'rgba(255,255,255,0.88)',
    textFaint: 'rgba(255,255,255,0.22)',
    textDim: 'rgba(255,255,255,0.55)',
    bgCard: '#26262e',
    border: 'rgba(255,255,255,0.07)',
    gold: '#FFB800',
    green: '#4CAF50',
  },
  Radii: { md: 14, card: 18, hero: 28, pill: 99, sm: 10 },
  Spacing: { screen: 16 },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(
  props: { userId?: string; name?: string; avatar?: string; onDismiss?: () => void } = {},
) {
  const {
    userId = 'user-1',
    name = 'Alice',
    avatar = '🦊',
    onDismiss = jest.fn(),
  } = props;
  return render(
    <ChildWelcomeModal userId={userId} name={name} avatar={avatar} onDismiss={onDismiss} />,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ChildWelcomeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when AsyncStorage already has the welcome flag', async () => {
    mockGetItem.mockResolvedValue('1');
    const { queryByText } = renderModal();
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
    expect(queryByText(/Bienvenue/)).toBeNull();
  });

  it('renders welcome message when AsyncStorage returns null', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByText } = renderModal();
    await waitFor(() => expect(getByText('Bienvenue Alice ! 🎉')).toBeTruthy());
  });

  it('shows the avatar emoji', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByText } = renderModal({ avatar: '🦊' });
    await waitFor(() => expect(getByText('🦊')).toBeTruthy());
  });

  it('shows the game loop emojis and labels', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByText } = renderModal();
    await waitFor(() => {
      expect(getByText('⚔️')).toBeTruthy();
      expect(getByText('✅')).toBeTruthy();
      expect(getByText('🪙')).toBeTruthy();
      expect(getByText('🎁')).toBeTruthy();
    });
  });

  it('calls onDismiss when CTA button is pressed', async () => {
    mockGetItem.mockResolvedValue(null);
    const onDismiss = jest.fn();
    const { getByText } = renderModal({ onDismiss });
    await waitFor(() => expect(getByText("Commencer l'aventure ⚔️")).toBeTruthy());
    fireEvent.press(getByText("Commencer l'aventure ⚔️"));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
  });

  it('calls AsyncStorage.setItem with correct key when CTA is pressed', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByText } = renderModal({ userId: 'user-1' });
    await waitFor(() => expect(getByText("Commencer l'aventure ⚔️")).toBeTruthy());
    fireEvent.press(getByText("Commencer l'aventure ⚔️"));
    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith('@kiddo:welcome:user-1', '1'),
    );
  });

  it('uses the provided userId in the storage key', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByText } = renderModal({ userId: 'child-42' });
    await waitFor(() => expect(getByText("Commencer l'aventure ⚔️")).toBeTruthy());
    fireEvent.press(getByText("Commencer l'aventure ⚔️"));
    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith('@kiddo:welcome:child-42', '1'),
    );
  });
});
