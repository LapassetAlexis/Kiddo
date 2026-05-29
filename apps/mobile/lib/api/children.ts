import { api } from '../api-client';
import type { ChildClass } from '../rpg';

export interface Child {
  id: string;
  name: string;
  avatar: string;
  color: string;
  sprite?: string;
  xp: number;
  class: ChildClass;
  level: number;
  levelTitle: string;
  levelEmoji: string;
  fcmToken?: string;
  createdAt: string;
}

export interface ChildStats extends Child {
  stats: {
    balance: number;
    totalGoldEarned: number;
    tasksCompleted: number;
    rewardsClaimed: number;
    xp: number;
    level: number;
  };
}

export interface Balance {
  balance: number;
}

export const childrenApi = {
  list: () => api.get<Child[]>('/children'),

  get: (id: string) => api.get<ChildStats>(`/children/${id}`),

  create: (data: { name: string; avatar: string; color: string; pin: string; class?: ChildClass; sprite?: string }) =>
    api.post<Child>('/children', data),

  update: (id: string, data: { name?: string; avatar?: string; color?: string; sprite?: string }) =>
    api.patch<Child>(`/children/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/children/${id}`),

  resetPin: (id: string, newPin: string) =>
    api.post<{ message: string }>(`/children/${id}/reset-pin`, { newPin }),

  getBalance: (id: string) =>
    api.get<Balance>(`/children/${id}/balance`),
};
