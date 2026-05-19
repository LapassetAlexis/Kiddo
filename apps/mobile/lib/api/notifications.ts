import { api } from '../api-client';

export const notificationsApi = {
  registerToken: (token: string) =>
    api.post<void>('/notifications/fcm-token', { token }),
};
