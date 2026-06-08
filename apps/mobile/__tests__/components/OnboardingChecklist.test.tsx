import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingChecklist from '@/components/ui/OnboardingChecklist';

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

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('@/lib/api/tasks', () => ({ tasksApi: { history: jest.fn() } }));
jest.mock('@/lib/api/rewards', () => ({ rewardsApi: { list: jest.fn() } }));
jest.mock('@/lib/api/children', () => ({ childrenApi: { list: jest.fn(), get: jest.fn() } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { tasksApi } from '@/lib/api/tasks';
import { rewardsApi } from '@/lib/api/rewards';
import { childrenApi } from '@/lib/api/children';

const mockGetItem  = AsyncStorage.getItem as jest.Mock;
const mockSetItem  = AsyncStorage.setItem as jest.Mock;
const mockHistory  = tasksApi.history as jest.Mock;
const mockList     = rewardsApi.list as jest.Mock;
const mockChildren = childrenApi.list as jest.Mock;
const mockGetChild = childrenApi.get as jest.Mock;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return all APIs in a clean empty-slate state (checklist visible, nothing done). */
function setupEmptyApis() {
  mockGetItem.mockResolvedValue(null);
  mockHistory.mockResolvedValue([]);
  mockList.mockResolvedValue([]);
  mockChildren.mockResolvedValue([]);
  mockGetChild.mockResolvedValue({});
}

function renderChecklist(childrenCount = 0) {
  return render(<OnboardingChecklist childrenCount={childrenCount} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when AsyncStorage has the onboarding-done flag', async () => {
    mockGetItem.mockResolvedValue('1');
    mockHistory.mockResolvedValue([]);
    mockList.mockResolvedValue([]);
    mockChildren.mockResolvedValue([]);
    const { queryByText } = renderChecklist();
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
    expect(queryByText('Premiers pas 🚀')).toBeNull();
  });

  it('renders all 5 step labels when all APIs return empty data', async () => {
    setupEmptyApis();
    const { getByText } = renderChecklist();
    await waitFor(() => {
      expect(getByText('Ajouter un enfant')).toBeTruthy();
      expect(getByText('Créer une première quête')).toBeTruthy();
      expect(getByText('Créer une première récompense')).toBeTruthy();
      expect(getByText('Valider une quête enfant')).toBeTruthy();
      expect(getByText('Fixer un objectif à un enfant')).toBeTruthy();
    });
  });

  it('shows "Ajouter un enfant" step as checked when childrenCount >= 1', async () => {
    setupEmptyApis();
    const { getAllByText } = renderChecklist(1);
    // The checkmark symbol ✓ appears next to each completed step
    await waitFor(() => {
      // At least one ✓ should be rendered (for the child step)
      expect(getAllByText('✓').length).toBeGreaterThanOrEqual(1);
    });
    // The label itself still appears (but with strikethrough style — we verify presence)
    const { getByText } = renderChecklist(1);
    await waitFor(() => expect(getByText('Ajouter un enfant')).toBeTruthy());
  });

  it('shows "Créer une première quête" as checked when tasksApi.history returns tasks', async () => {
    setupEmptyApis();
    mockHistory.mockResolvedValue([{ id: 't1', status: 'pending' }]);
    const { getAllByText } = renderChecklist(0);
    await waitFor(() => expect(getAllByText('✓').length).toBeGreaterThanOrEqual(1));
  });

  it('shows "Créer une première récompense" as checked when rewardsApi.list returns rewards', async () => {
    setupEmptyApis();
    mockList.mockResolvedValue([{ id: 'r1' }]);
    const { getAllByText } = renderChecklist(0);
    await waitFor(() => expect(getAllByText('✓').length).toBeGreaterThanOrEqual(1));
  });

  it('shows "Valider une quête enfant" as checked when a validated task exists', async () => {
    setupEmptyApis();
    mockHistory.mockResolvedValue([{ id: 't1', status: 'validated' }]);
    const { getAllByText } = renderChecklist(0);
    // Two steps done: "Créer une première quête" + "Valider une quête enfant"
    await waitFor(() => expect(getAllByText('✓').length).toBeGreaterThanOrEqual(2));
  });

  it('shows goal step as checked when a child has levelGoal set', async () => {
    setupEmptyApis();
    mockChildren.mockResolvedValue([{ id: 'child-1' }]);
    mockGetChild.mockResolvedValue({ levelGoal: 5 });
    const { getAllByText } = renderChecklist(0);
    await waitFor(() => expect(getAllByText('✓').length).toBeGreaterThanOrEqual(1));
  });

  it('shows "Passer" button when not all steps are done and dismisses on press', async () => {
    setupEmptyApis();
    const { getByText } = renderChecklist(0);
    await waitFor(() => expect(getByText('Passer')).toBeTruthy());
    fireEvent.press(getByText('Passer'));
    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith('@kiddo:onboarding:done', '1'),
    );
  });

  it('shows the goal-step hint text when goal is not yet set', async () => {
    setupEmptyApis();
    const { getByText } = renderChecklist(0);
    await waitFor(() =>
      expect(getByText("Paramètres → Modifier l'enfant → Objectif de niveau")).toBeTruthy(),
    );
  });

  it('shows celebration banner when all 5 steps are done', async () => {
    setupEmptyApis();
    // All done: childrenCount=1, task+validated, reward, goal
    mockHistory.mockResolvedValue([{ id: 't1', status: 'validated' }]);
    mockList.mockResolvedValue([{ id: 'r1' }]);
    mockChildren.mockResolvedValue([{ id: 'child-1' }]);
    mockGetChild.mockResolvedValue({ levelGoal: 3 });
    const { getByText } = renderChecklist(1);
    await waitFor(() =>
      expect(getByText('🎉 Tout est prêt — tu maîtrises Kiddo !')).toBeTruthy(),
    );
  });
});
