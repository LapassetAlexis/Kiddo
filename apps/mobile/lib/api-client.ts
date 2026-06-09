import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://kiddo-api-f1ip.onrender.com/api';
const TOKEN_KEY        = 'kiddo_jwt';
const PARENT_TOKEN_KEY = 'kiddo_parent_jwt';

// ── Token storage ────────────────────────────────────────────────────────────

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  const v = await SecureStore.getItemAsync(TOKEN_KEY);
  return v ? v.trim() : null;
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveParentToken(token: string) {
  await SecureStore.setItemAsync(PARENT_TOKEN_KEY, token);
}

export async function getParentToken(): Promise<string | null> {
  const v = await SecureStore.getItemAsync(PARENT_TOKEN_KEY);
  return v ? v.trim() : null;
}

export async function clearParentToken() {
  await SecureStore.deleteItemAsync(PARENT_TOKEN_KEY);
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

  if (!res.ok) {
    // 401 : token expiré ou invalide → effacer le token
    if (res.status === 401 && withAuth) {
      await clearToken();
    }
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export const api = {
  get:    <T>(path: string, auth = true)                     => request<T>(path, { method: 'GET' }, auth),
  post:   <T>(path: string, data?: unknown, auth = true)     => request<T>(path, { method: 'POST',  body: JSON.stringify(data) }, auth),
  patch:  <T>(path: string, data?: unknown, auth = true)     => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }, auth),
  delete: <T>(path: string, auth = true)                     => request<T>(path, { method: 'DELETE' }, auth),
};
