import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// expo-secure-store : mock via __mocks__/expo-secure-store.js
jest.mock('expo-secure-store');

// Mock des fonctions authApi avec préfixe "mock" (autorisé par Jest)
const mockAuthLogin    = jest.fn();
const mockAuthChildPin = jest.fn();
const mockAuthMe       = jest.fn();
const mockAuthSaveToken   = jest.fn(() => Promise.resolve());
const mockAuthClearToken  = jest.fn(() => Promise.resolve());

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login:      (...args: unknown[]) => mockAuthLogin(...args),
    childPin:   (...args: unknown[]) => mockAuthChildPin(...args),
    me:         (...args: unknown[]) => mockAuthMe(...args),
    saveToken:  (...args: unknown[]) => mockAuthSaveToken(...args),
    clearToken: (...args: unknown[]) => mockAuthClearToken(...args),
  },
}));

// Helper : construit un JWT factice non-expiré
function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload }));
  return `${header}.${body}.fake`;
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth — hors du Provider', () => {
  it('lève une erreur si utilisé hors AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow();
  });
});

describe('useAuth — état initial', () => {
  it('user est null au démarrage (pas de token en store)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});

describe('useAuth — loginParent', () => {
  it('appelle authApi.login et sauvegarde le token', async () => {
    const token = buildJwt({ sub: 'family-1', role: 'parent', email: 'test@test.com' });
    mockAuthLogin.mockResolvedValueOnce({ accessToken: token });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.loginParent('test@test.com', 'password');
    });

    expect(mockAuthLogin).toHaveBeenCalledWith('test@test.com', 'password');
    expect(mockAuthSaveToken).toHaveBeenCalledWith(token);
    expect(result.current.user?.role).toBe('parent');
    expect(result.current.user?.id).toBe('family-1');
  });

  it('propage l\'erreur si login échoue', async () => {
    mockAuthLogin.mockRejectedValueOnce(new Error('Unauthorized'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => { await result.current.loginParent('bad@test.com', 'wrong'); })
    ).rejects.toThrow('Unauthorized');
  });
});

describe('useAuth — loginChild', () => {
  it('appelle authApi.childPin et set user role=child', async () => {
    const token = buildJwt({ sub: 'child-1', role: 'child', familyId: 'family-1' });
    mockAuthChildPin.mockResolvedValueOnce({ accessToken: token });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.loginChild('child-1', '1234');
    });

    expect(mockAuthChildPin).toHaveBeenCalledWith('child-1', '1234');
    expect(result.current.user?.role).toBe('child');
    expect(result.current.user?.id).toBe('child-1');
    expect(result.current.user?.familyId).toBe('family-1');
  });
});

describe('useAuth — logout', () => {
  it('efface le token et set user à null', async () => {
    const token = buildJwt({ sub: 'family-1', role: 'parent', email: 'test@test.com' });
    mockAuthLogin.mockResolvedValueOnce({ accessToken: token });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.loginParent('test@test.com', 'pw'); });
    expect(result.current.user).not.toBeNull();

    await act(async () => { await result.current.logout(); });
    expect(mockAuthClearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
