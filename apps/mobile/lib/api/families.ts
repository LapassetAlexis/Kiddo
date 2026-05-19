import { api } from '../api-client';

export interface FamilyProfile {
  id: string;
  email: string;
  familyId?: string;
  name?: string;
  timezone: string;
  inviteCode?: string;
  createdAt?: string;
  notifTaskSubmitted?: boolean;
  notifRewardClaimed?: boolean;
  notifStreakAlert?: boolean;
}

export interface ParentMember {
  id: string;
  name?: string;
  email: string;
}

export const familiesApi = {
  getMe: () => api.get<FamilyProfile>('/families/me'),

  listParents: () => api.get<ParentMember[]>('/families/parents'),

  updateProfile: (data: { email?: string; name?: string; timezone?: string }) =>
    api.patch<FamilyProfile>('/families/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/families/me/password', { currentPassword, newPassword }),

  updateNotifPrefs: (prefs: { notifTaskSubmitted?: boolean; notifRewardClaimed?: boolean; notifStreakAlert?: boolean }) =>
    api.patch<FamilyProfile>('/families/me/notifications', prefs),

  regenerateInviteCode: () =>
    api.post<FamilyProfile>('/families/invite-code/regenerate', {}),
};
