import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'CUSTOMER' | 'OPERATOR';
export interface SessionUser { id: number; name: string; email: string; role: UserRole; }

interface AuthContextValue {
  user: SessionUser | null;
  signIn: (email: string, password: string, role: UserRole) => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'codenova-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo(() => ({
    user,
    signIn: (email: string, password: string, role: UserRole) => {
      if (!email.trim() || password.length < 4) return false;
      setUser({ id: role === 'OPERATOR' ? 1 : 1, name: role === 'OPERATOR' ? 'Ops Lead' : email.split('@')[0], email, role });
      return true;
    },
    signOut: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}