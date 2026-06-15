import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppModal, { ModalConfig, ModalButton } from '@/components/ui/AppModal';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/constants/theme', () => ({
  Colors: {
    orange: '#FF7040',
    textPrimary: 'rgba(255,255,255,0.88)',
    textFaint: 'rgba(255,255,255,0.22)',
    bgCard: '#26262e',
    border: 'rgba(255,255,255,0.07)',
    gold: '#FFB800',
    green: '#4CAF50',
  },
  Radii: { md: 14, card: 18, hero: 28, pill: 99, sm: 10 },
  Fonts: { pixel: 'VT323_400Regular', pixelBold: 'PressStart2P_400Regular' },
  PixelShadow: {
    gold:   { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b37f00', borderRightColor: '#b37f00' },
    green:  { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#2e7d32', borderRightColor: '#2e7d32' },
    orange: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#bf4020', borderRightColor: '#bf4020' },
    red:    { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b71c1c', borderRightColor: '#b71c1c' },
    subtle: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: 'rgba(0,0,0,0.4)', borderRightColor: 'rgba(0,0,0,0.4)' },
  },
}));

// Animated is auto-mocked by jest-expo; spring/timing complete synchronously.

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(config: ModalConfig | null, onHide = jest.fn()) {
  return render(
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 390, height: 844 } }}>
      <AppModal config={config} onHide={onHide} />
    </SafeAreaProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AppModal', () => {
  it('does not render when config is null', () => {
    const { queryByText } = renderModal(null);
    expect(queryByText(/./)).toBeNull();
  });

  it('renders title when config is provided', () => {
    const { getByText } = renderModal({ title: 'Test Title' });
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders message when config includes message', () => {
    const { getByText } = renderModal({ title: 'T', message: 'Some message' });
    expect(getByText('Some message')).toBeTruthy();
  });

  it('renders icon when config includes icon', () => {
    const { getByText } = renderModal({ title: 'T', icon: '⚠️' });
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('does not render message element when message is omitted', () => {
    const { queryByText } = renderModal({ title: 'T' });
    // Only the title should appear, no extra text node for message
    expect(queryByText('Some message')).toBeNull();
  });

  it('renders correct number of buttons from config', () => {
    const buttons: ModalButton[] = [
      { label: 'Button A', style: 'default' },
      { label: 'Button B', style: 'cancel' },
      { label: 'Button C', style: 'destructive' },
    ];
    const { getByText } = renderModal({ title: 'T', buttons });
    expect(getByText('Button A')).toBeTruthy();
    expect(getByText('Button B')).toBeTruthy();
    expect(getByText('Button C')).toBeTruthy();
  });

  it('renders default "OK" button when buttons array is omitted', () => {
    const { getByText } = renderModal({ title: 'T' });
    expect(getByText('OK')).toBeTruthy();
  });

  it('calls button.onPress + onHide when default button is tapped', async () => {
    const onHide = jest.fn();
    const onPress = jest.fn();
    const { getByText } = renderModal({ title: 'Test', buttons: [{ label: 'Fermer', style: 'default', onPress }] }, onHide);
    fireEvent.press(getByText('Fermer'));
    await waitFor(() => expect(onPress).toHaveBeenCalled());
  });

  it('calls button.onPress callback when a button is tapped', async () => {
    const onBtnPress = jest.fn();
    const onHide = jest.fn();
    const buttons: ModalButton[] = [{ label: 'Confirm', onPress: onBtnPress, style: 'default' }];
    const { getByText } = renderModal({ title: 'T', buttons }, onHide);

    fireEvent.press(getByText('Confirm'));

    await waitFor(() => {
      expect(onBtnPress).toHaveBeenCalledTimes(1);
      expect(onHide).toHaveBeenCalledTimes(1);
    });
  });

  it('default-style button renders with its label visible', () => {
    const buttons: ModalButton[] = [{ label: 'Go', style: 'default' }];
    const { getByText } = renderModal({ title: 'T', buttons });
    expect(getByText('Go')).toBeTruthy();
  });

  it('cancel-style button renders with its label visible', () => {
    const buttons: ModalButton[] = [{ label: 'Annuler', style: 'cancel' }];
    const { getByText } = renderModal({ title: 'T', buttons });
    expect(getByText('Annuler')).toBeTruthy();
  });

  it('destructive-style button renders with its label visible', () => {
    const buttons: ModalButton[] = [{ label: 'Supprimer', style: 'destructive' }];
    const { getByText } = renderModal({ title: 'T', buttons });
    expect(getByText('Supprimer')).toBeTruthy();
  });

  it('renders multiple buttons and each fires its own callback', async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    const buttons: ModalButton[] = [
      { label: 'OK', style: 'default', onPress: onOk },
      { label: 'Non', style: 'cancel', onPress: onCancel },
    ];
    const { getByText } = renderModal({ title: 'Choix', buttons });

    fireEvent.press(getByText('Non'));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(onOk).not.toHaveBeenCalled();
  });
});
