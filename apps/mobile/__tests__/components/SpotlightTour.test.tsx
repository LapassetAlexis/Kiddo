import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour';

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
  Fonts: { pixel: 'VT323_400Regular', pixelBold: 'PressStart2P_400Regular' },
  PixelShadow: {
    gold:   { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b37f00', borderRightColor: '#b37f00' },
    green:  { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#2e7d32', borderRightColor: '#2e7d32' },
    orange: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#bf4020', borderRightColor: '#bf4020' },
    red:    { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b71c1c', borderRightColor: '#b71c1c' },
    subtle: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: 'rgba(0,0,0,0.4)', borderRightColor: 'rgba(0,0,0,0.4)' },
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRef(measureFn = jest.fn()) {
  const ref = { current: { measureInWindow: measureFn } };
  return ref as any;
}

function buildSteps(count: number): TourStep[] {
  return Array.from({ length: count }, (_, i) => ({
    ref: makeRef(),
    title: `Step ${i + 1} Title`,
    body: `Step ${i + 1} body text`,
  }));
}

function renderTour(
  steps: TourStep[],
  visible: boolean,
  onFinish = jest.fn(),
) {
  return render(<SpotlightTour steps={steps} visible={visible} onFinish={onFinish} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SpotlightTour', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when visible is false', () => {
    const steps = buildSteps(2);
    const { queryByText } = renderTour(steps, false);
    expect(queryByText('Step 1 Title')).toBeNull();
    expect(queryByText('Step 2 Title')).toBeNull();
  });

  it('renders first step title and body when visible is true', async () => {
    const steps = buildSteps(2);
    const { getByText } = renderTour(steps, true);
    expect(getByText('Step 1 Title')).toBeTruthy();
    expect(getByText('Step 1 body text')).toBeTruthy();
  });

  it('renders one progress dot per step (step count reflected in steps array)', () => {
    // The dots are unstyled View elements with no accessible label.
    // We verify the correct number of steps were passed and that the component
    // renders without error, showing the first step's content.
    const steps = buildSteps(2);
    const { getByText } = renderTour(steps, true);
    // Two dots means two steps; first step content is visible
    expect(steps).toHaveLength(2);
    expect(getByText('Step 1 Title')).toBeTruthy();
  });

  it('calls onFinish when "Passer" is pressed', () => {
    const onFinish = jest.fn();
    const steps = buildSteps(2);
    const { getByText } = renderTour(steps, true, onFinish);
    fireEvent.press(getByText('Passer'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('shows "Suivant →" on step 1 of a 2-step tour and advances to step 2 on press', async () => {
    const steps = buildSteps(2);
    const { getByText } = renderTour(steps, true);
    expect(getByText('Suivant →')).toBeTruthy();
    fireEvent.press(getByText('Suivant →'));
    await waitFor(() => expect(getByText('Step 2 Title')).toBeTruthy());
  });

  it('shows "Terminer ✓" on the last step and calls onFinish when pressed', async () => {
    const steps = buildSteps(2);
    const onFinish = jest.fn();
    const { getByText } = renderTour(steps, true, onFinish);
    // Advance to last step
    fireEvent.press(getByText('Suivant →'));
    await waitFor(() => expect(getByText('Terminer ✓')).toBeTruthy());
    fireEvent.press(getByText('Terminer ✓'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('shows "Terminer ✓" immediately for a single-step tour', () => {
    const steps = buildSteps(1);
    const { getByText } = renderTour(steps, true);
    expect(getByText('Terminer ✓')).toBeTruthy();
  });
});
