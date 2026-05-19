import { api } from '../api-client';

export interface Transaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  note?: string;
  referenceId?: string;
  createdAt: string;
  child: { id: string; name: string; avatar: string };
}

export interface BalanceStats {
  balance: number;
  earnedTotal: number;
  spentTotal: number;
  earnedThisWeek: number;
  spentThisWeek: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export const transactionsApi = {
  list: (childId: string, page = 1) =>
    api.get<{ data: Transaction[]; total: number }>(`/transactions?childId=${childId}&page=${page}`),

  getBalance: (childId: string) =>
    api.get<BalanceStats>(`/transactions/balance/${childId}`),

  getStreak: (childId: string, timezone = 'Europe/Paris') =>
    api.get<StreakStats>(`/transactions/streak/${childId}?timezone=${encodeURIComponent(timezone)}`),
};
