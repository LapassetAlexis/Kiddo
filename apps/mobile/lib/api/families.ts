import { api } from '../api-client';

export interface FamilyProfile {
  id: string;
  email: string;
  name?: string;
  timezone: string;
  createdAt: string;
}

export const familiesApi = {
  getMe: () => api.get<FamilyProfile>('/families/me'),

  updateProfile: (data: { email?: string; name?: string; timezone?: string }) =>
    api.patch<FamilyProfile>('/families/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/families/me/password', { currentPassword, newPassword }),
};
