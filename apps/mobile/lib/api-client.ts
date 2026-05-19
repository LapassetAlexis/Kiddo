import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// En émulateur Android, 10.0.2.2 pointe vers localhost de l'hôte
// En simulateur iOS ou web, localhost fonctionne directement
const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  return 'http://localhost:3000/api';
};

export const BASE_URL = getBaseUrl();
const TOKEN_KEY = 'kidpoints_jwt';

// ── Token storage ────────────────────────────────────────────────────────────

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, public body: any) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export const api = {
  get:    <T>(path: string, auth = true)                     => request<T>(path, { method: 'GET' }, auth),
  post:   <T>(path: string, data?: unknown, auth = true)     => request<T>(path, { method: 'POST',  body: JSON.stringify(data) }, auth),
  patch:  <T>(path: string, data?: unknown, auth = true)     => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }, auth),
  delete: <T>(path: string, auth = true)                     => request<T>(path, { method: 'DELETE' }, auth),
};
