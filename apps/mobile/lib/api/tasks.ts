import { api } from '../api-client';

export type TaskStatus = 'created' | 'pending_approval' | 'validated' | 'rejected';
export type TaskFrequency = 'once' | 'daily' | 'weekly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  frequency: TaskFrequency;
  status: TaskStatus;
  photoUrl?: string;
  note?: string;
  rejectionReason?: string;
  submittedAt?: string;
  validatedAt?: string;
  createdAt: string;
  child: { id: string; name: string; avatar: string; color: string };
}

export const tasksApi = {
  list: (childId?: string, status?: TaskStatus) => {
    const params = new URLSearchParams();
    if (childId) params.set('childId', childId);
    if (status)  params.set('status', status);
    return api.get<Task[]>(`/tasks?${params}`);
  },

  history: (childId?: string) => {
    const params = childId ? `?childId=${childId}` : '';
    return api.get<Task[]>(`/tasks/history${params}`);
  },

  create: (data: {
    childId: string; title: string; points: number;
    frequency?: TaskFrequency; weekDay?: number;
  }) => api.post<Task>('/tasks', data),

  complete: (id: string, note?: string, photoUrl?: string) =>
    api.patch<Task>(`/tasks/${id}/complete`, { note, photoUrl }),

  approve: (id: string) =>
    api.patch<Task>(`/tasks/${id}/approve`),

  reject: (id: string, reason?: string) =>
    api.patch<Task>(`/tasks/${id}/reject`, { reason }),
};
