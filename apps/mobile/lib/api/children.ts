import { api } from '../api-client';

export interface Child {
  id: string;
  name: string;
  avatar: string;
  color: string;
  fcmToken?: string;
  createdAt: string;
}

export interface ChildStats {
  child: Child;
  tasksCompleted: number;
  rewardsClaimed: number;
  totalPtsEarned: number;
}

export interface Balance {
  balance: number;
}

export const childrenApi = {
  list: () => api.get<Child[]>('/children'),

  get: (id: string) => api.get<ChildStats>(`/children/${id}`),

  create: (data: { name: string; avatar: string; color: string; pin: string }) =>
    api.post<Child>('/children', data),

  update: (id: string, data: { name?: string; avatar?: string; color?: string }) =>
    api.patch<Child>(`/children/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/children/${id}`),

  resetPin: (id: string, newPin: string) =>
    api.post<{ message: string }>(`/children/${id}/reset-pin`, { newPin }),

  getBalance: (id: string) =>
    api.get<Balance>(`/children/${id}/balance`),
};
