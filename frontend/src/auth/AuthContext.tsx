import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import loginService from '../services/login';
import type { User, LoginInput } from '../types/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  unavailable: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const request = useRef(0);

  async function refresh() {
    const version = ++request.current;
    setLoading(true);
    try {
      const current = await loginService.restoreLogin();
      if (version === request.current) { setUser(current); setUnavailable(false); }
    } catch {
      if (version === request.current) { setUser(null); setUnavailable(true); }
    } finally {
      if (version === request.current) setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    return () => { request.current += 1; };
  }, []);

  async function login(input: LoginInput) {
    const current = await loginService.login(input);
    request.current += 1;
    setUser(current);
    setLoading(false);
    setUnavailable(false);
  }

  async function logout() {
    await loginService.logout();
    request.current += 1;
    setUser(null);
    setLoading(false);
    setUnavailable(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, unavailable, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Coloca AuthProvider alrededor de App.');
  return context;
}
