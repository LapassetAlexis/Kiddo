import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import { getToken, clearToken, saveToken, saveParentToken, getParentToken, clearParentToken } from '@/lib/api-client';

type Role = 'parent' | 'child';

interface AuthUser {
  id: string;
  role: Role;
  email?: string;         // parent only
  familyId?: string;      // child only
  name?: string;
  avatar?: string;        // child only
  color?: string;         // child only
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginParent: (email: string, password: string) => Promise<void>;
  loginChild: (childId: string, pin: string) => Promise<void>;
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

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const payload = parseJwt(token);
          if (payload && payload.exp * 1000 > Date.now()) {
            const me = await authApi.me().catch(() => null);
            setUser({
              id:       payload.sub,
              role:     payload.role,
              email:    payload.email ?? me?.email,
              familyId: payload.familyId,
              name:     me?.name,
              avatar:   me?.avatar,
              color:    (me as any)?.color,
            });
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
    setUser({ id: payload.sub, role: 'parent', email: payload.email });
  }

  async function loginChild(childId: string, pin: string) {
    // Sauvegarde le token parent avant d'écraser avec le token enfant
    const parentToken = await getToken();
    if (parentToken) await saveParentToken(parentToken);
    const { accessToken } = await authApi.childPin(childId, pin);
    await authApi.saveToken(accessToken);
    const payload = parseJwt(accessToken);
    const me = await authApi.me().catch(() => null);
    setUser({ id: payload.sub, role: 'child', familyId: payload.familyId, name: me?.name, avatar: me?.avatar, color: (me as any)?.color });
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
    setUser({ id: payload.sub, role: 'parent', email: payload.email });
    return true;
  }

  async function logout() {
    await authApi.clearToken();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const me = await authApi.me();
      setUser(u => u ? { ...u, email: me.email, name: me.name, avatar: me.avatar, color: (me as any).color } : null);
    } catch {
      await logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginParent, loginChild, switchToParent, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
