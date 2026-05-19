import { api, saveToken, clearToken } from '../api-client';

export interface AuthResponse { accessToken: string; }

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/parent/login', { email, password }, false),

  childPin: (childId: string, pin: string) =>
    api.post<AuthResponse>('/auth/child/pin', { childId, pin }, false),

  register: (name: string, email: string, password: string) =>
    api.post<{ message: string }>('/auth/register', { name, email, password }, false),

  verifyEmail: (email: string, code: string) =>
    api.post<AuthResponse>('/auth/verify-email', { email, code }, false),

  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }, false),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }, false),

  verifyResetCode: (email: string, code: string) =>
    api.post<{ valid: boolean }>('/auth/verify-reset-code', { email, code }, false),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { email, code, newPassword }, false),

  me: () => api.get<{ id: string; role: string; email?: string; name?: string; avatar?: string; familyId?: string; children?: any[] }>('/auth/me'),

  saveToken,
  clearToken,
};
