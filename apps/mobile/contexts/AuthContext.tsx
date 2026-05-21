import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import { notificationsApi } from '@/lib/api/notifications';
import { getToken, clearToken, saveToken, saveParentToken, getParentToken, clearParentToken } from '@/lib/api-client';
import { registerForPushNotifications } from '@/lib/registerForPushNotifications';

type Role = 'parent' | 'child';

interface AuthUser {
  id: string;
  role: Role;
  email?: string;         // parent only
  familyId?: string;      // both parent and child
  name?: string;
  avatar?: string;        // child only
  color?: string;         // child only
  inviteCode?: string;    // parent only
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginParent: (email: string, password: string) => Promise<void>;
  loginChild: (childId: string, pin: string) => Promise<void>;
  joinFamily: (name: string, email: string, password: string, inviteCode: string) => Promise<void>;
  switchToParent: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const payload = parseJwt(token);
          if (payload && payload.exp * 1000 > Date.now()) {
            if (payload.role === 'child') {
              const parentToken = await getParentToken();
              const parentPayload = parentToken ? parseJwt(parentToken) : null;
              if (parentPayload && parentPayload.exp * 1000 > Date.now()) {
                await saveToken(parentToken);
                await clearParentToken();
                const me = await authApi.me().catch(() => null);
                setUser({
                  id: parentPayload.sub,
                  role: 'parent',
                  email: parentPayload.email ?? me?.email,
                  familyId: parentPayload.familyId ?? me?.familyId,
                  name: me?.name,
                  avatar: me?.avatar,
                  color: (me as any)?.color,
                  inviteCode: (me as any)?.inviteCode,
                });
              } else {
                await clearToken();
                await clearParentToken();
              }
            } else {
              const me = await authApi.me().catch(() => null);
              setUser({
                id:         payload.sub,
                role:       payload.role,
                email:      payload.email ?? me?.email,
                familyId:   payload.familyId ?? me?.familyId,
                name:       me?.name,
                avatar:     me?.avatar,
                color:      (me as any)?.color,
                inviteCode: (me as any)?.inviteCode,
              });
            }
          } else {
            await clearToken();
          }
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loginParent(email: string, password: string) {
    const { accessToken } = await authApi.login(email, password);
    await authApi.saveToken(accessToken);
    const payload = parseJwt(accessToken);
    setUser({ id: payload.sub, role: 'parent', email: payload.email, familyId: payload.familyId });
    registerForPushNotifications().then(token => {
      if (token) notificationsApi.registerToken(token).catch(() => null);
    });
  }

  async function loginChild(childId: string, pin: string) {
    const parentToken = await getToken();
    if (parentToken) await saveParentToken(parentToken);
    const { accessToken } = await authApi.childPin(childId, pin);
    await authApi.saveToken(accessToken);
    const payload = parseJwt(accessToken);
    const me = await authApi.me().catch(() => null);
    setUser({ id: payload.sub, role: 'child', familyId: payload.familyId, name: me?.name, avatar: me?.avatar, color: (me as any)?.color });
    registerForPushNotifications().then(token => {
      if (token) notificationsApi.registerToken(token).catch(() => null);
    });
  }

  async function joinFamily(name: string, email: string, password: string, inviteCode: string) {
    await authApi.joinFamily(name, email, password, inviteCode);
  }

  async function switchToParent(): Promise<boolean> {
    const parentToken = await getParentToken();
    if (!parentToken) return false;
    const payload = parseJwt(parentToken);
    if (!payload || payload.exp * 1000 <= Date.now()) {
      await clearParentToken();
      return false;
    }
    await saveToken(parentToken);
    await clearParentToken();
    setUser({ id: payload.sub, role: 'parent', email: payload.email, familyId: payload.familyId });
    return true;
  }

  async function logout() {
    await authApi.clearToken();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const me = await authApi.me();
      setUser(u => u ? {
        ...u,
        email:      me.email,
        familyId:   me.familyId ?? u.familyId,
        name:       me.name,
        avatar:     me.avatar,
        color:      (me as any).color,
        inviteCode: (me as any).inviteCode,
      } : null);
    } catch {
      await logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginParent, loginChild, joinFamily, switchToParent, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
