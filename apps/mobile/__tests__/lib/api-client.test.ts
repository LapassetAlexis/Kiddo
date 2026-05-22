/**
 * Tests unitaires pour lib/api-client.ts
 * expo-secure-store : mock automatique via __mocks__/expo-secure-store.js
 * fetch : mocké globalement
 */

jest.mock('expo-secure-store');
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import * as SecureStore from 'expo-secure-store';
import { api, ApiError, saveToken, clearToken, getToken, BASE_URL } from '@/lib/api-client';

const TOKEN_KEY = 'kiddo_jwt';

function mockFetch(status: number, body: unknown) {
  const text = JSON.stringify(body);
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  (SecureStore as any)._clear?.();
});

describe('api-client — helpers de token', () => {
  it('saveToken stocke le JWT dans SecureStore', async () => {
    await saveToken('my-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, 'my-token');
  });

  it('getToken retourne null si rien en store', async () => {
    const token = await getToken();
    expect(token).toBeNull();
  });

  it('getToken retourne la valeur stockée', async () => {
    await saveToken('saved-token');
    const token = await getToken();
    expect(token).toBe('saved-token');
  });

  it('clearToken supprime le JWT', async () => {
    await saveToken('to-delete');
    await clearToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
  });
});

describe('api-client — méthodes HTTP', () => {
  it('api.get envoie GET sur la bonne URL', async () => {
    mockFetch(200, { ok: true });
    await api.get('/test');
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('api.post envoie POST avec body JSON', async () => {
    mockFetch(201, { id: 1 });
    await api.post('/items', { name: 'Lucas' });
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect(call[1].body).toBe(JSON.stringify({ name: 'Lucas' }));
  });

  it('api.patch envoie PATCH avec body', async () => {
    mockFetch(200, {});
    await api.patch('/items/1', { name: 'Emma' });
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('PATCH');
  });

  it('api.delete envoie DELETE', async () => {
    mockFetch(200, {});
    await api.delete('/items/1');
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('DELETE');
  });

  it('ajoute le header Authorization quand un token existe', async () => {
    await saveToken('jwt-token');
    mockFetch(200, {});
    await api.get('/protected');
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer jwt-token');
  });

  it("n'ajoute pas Authorization quand withAuth=false", async () => {
    await saveToken('jwt-token');
    mockFetch(200, {});
    await api.get('/public', false);
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it("n'ajoute pas Authorization quand aucun token", async () => {
    mockFetch(200, {});
    await api.get('/resource');
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });
});

describe('api-client — gestion des erreurs', () => {
  it('lève ApiError sur réponse non-200', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    await expect(api.get('/secret')).rejects.toThrow(ApiError);
  });

  it('ApiError.status contient le code HTTP', async () => {
    mockFetch(404, { message: 'Not Found' });
    try {
      await api.get('/missing');
    } catch (e) {
      expect((e as ApiError).status).toBe(404);
    }
  });

  it('ApiError.message contient le message serveur', async () => {
    mockFetch(403, { message: 'Forbidden' });
    try {
      await api.get('/admin');
    } catch (e) {
      expect((e as ApiError).message).toBe('Forbidden');
    }
  });

  it('ApiError.name est "ApiError"', async () => {
    mockFetch(500, { message: 'Server Error' });
    try {
      await api.get('/broken');
    } catch (e) {
      expect((e as ApiError).name).toBe('ApiError');
    }
  });
});
