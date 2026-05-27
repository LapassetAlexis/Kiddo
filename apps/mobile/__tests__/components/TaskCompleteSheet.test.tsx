import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TaskCompleteSheet from '@/components/ui/TaskCompleteSheet';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/constants/theme', () => ({
  Colors: {
    textPrimary: 'rgba(255,255,255,0.88)',
    textDim: 'rgba(255,255,255,0.40)',
    textFaint: 'rgba(255,255,255,0.22)',
    bgCard: '#26262e',
    border: 'rgba(255,255,255,0.07)',
    gold: '#FFB800',
    green: '#4CAF50',
    greenDim: '#66BB6A',
    orange: '#FF7040',
  },
  Radii: { md: 14, card: 18, hero: 28, pill: 99, sm: 10 },
}));

jest.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    complete: jest.fn(),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockTask = { id: 'task-1', name: 'Ranger sa chambre', gold: 30, xp: 10 };

function renderSheet(
  task: typeof mockTask | null,
  onConfirm = jest.fn(),
  onClose = jest.fn(),
) {
  return render(
    <TaskCompleteSheet task={task} onConfirm={onConfirm} onClose={onClose} />,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TaskCompleteSheet', () => {
  it('does not render when task is null', () => {
    const { queryByText } = renderSheet(null);
    expect(queryByText(/./)).toBeNull();
  });

  it('renders the task name when task is provided', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('Ranger sa chambre')).toBeTruthy();
  });

  it('renders the rewards with gold and xp', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('+30🪙  +10⭐')).toBeTruthy();
  });

  it('renders the confirm button "C\'est fait ! ✓"', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText("C'est fait ! ✓")).toBeTruthy();
  });

  it('renders the cancel button "Pas encore…"', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('Pas encore…')).toBeTruthy();
  });

  it('calls onClose when cancel button is pressed', async () => {
    const onClose = jest.fn();
    const { getByText } = renderSheet(mockTask, jest.fn(), onClose);

    fireEvent.press(getByText('Pas encore…'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onConfirm with taskId and empty note when confirmed without note', async () => {
    const onConfirm = jest.fn();
    const { getByText } = renderSheet(mockTask, onConfirm);

    fireEvent.press(getByText("C'est fait ! ✓"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('task-1', '', undefined);
    });
  });

  it('note input is accessible and accepts text', () => {
    const { getByPlaceholderText } = renderSheet(mockTask);
    const input = getByPlaceholderText("Ex : J'ai tout rangé, même sous le bureau !");
    expect(input).toBeTruthy();
    fireEvent.changeText(input, 'Super rangé !');
    expect(input.props.value).toBe('Super rangé !');
  });

  it('calls onConfirm with note when note is filled before confirming', async () => {
    const onConfirm = jest.fn();
    const { getByPlaceholderText, getByText } = renderSheet(mockTask, onConfirm);

    const input = getByPlaceholderText("Ex : J'ai tout rangé, même sous le bureau !");
    fireEvent.changeText(input, 'Tout est rangé !');

    fireEvent.press(getByText("C'est fait ! ✓"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('task-1', 'Tout est rangé !', undefined);
    });
  });

  it('renders photo action buttons when no photo is selected', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('Appareil photo')).toBeTruthy();
    expect(getByText('Galerie')).toBeTruthy();
  });

  it('renders message for parent section label', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('Message pour ton gardien')).toBeTruthy();
  });

  it('renders proof photo section label', () => {
    const { getByText } = renderSheet(mockTask);
    expect(getByText('Preuve en photo')).toBeTruthy();
  });
});
