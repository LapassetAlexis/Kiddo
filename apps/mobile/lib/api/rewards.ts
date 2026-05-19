import { api } from '../api-client';

export type RewardAvailability = 'unlimited' | 'once';
export type RewardStatus = 'available' | 'claimed' | 'granted';

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  availability: RewardAvailability;
  status: RewardStatus;
  createdAt: string;
  childId?: string;
  childName?: string;
  childEmoji?: string;
}

export const rewardsApi = {
  list: () => api.get<Reward[]>('/rewards'),

  history: (childId?: string) => {
    const params = childId ? `?childId=${childId}` : '';
    return api.get<any[]>(`/rewards/history${params}`);
  },

  create: (data: { title: string; emoji: string; cost: number; availability?: RewardAvailability }) =>
    api.post<Reward>('/rewards', data),

  update: (id: string, data: Partial<{ title: string; emoji: string; cost: number; availability: RewardAvailability }>) =>
    api.patch<Reward>(`/rewards/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/rewards/${id}`),

  redeem: (id: string, childId?: string) =>
    api.post<{ message: string }>(`/rewards/${id}/redeem`, { childId }),

  grant: (id: string) =>
    api.post<{ message: string }>(`/rewards/${id}/grant`),

  refuse: (id: string) =>
    api.post<{ message: string }>(`/rewards/${id}/refuse`),
};
