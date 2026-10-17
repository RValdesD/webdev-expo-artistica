import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import authService from '../services/auth';
import type { Client, LoginInput } from '../types/auth';

interface AuthState {
  client: Client | null;
  loading: boolean;
  unavailable: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const request = useRef(0);

  async function refresh() {
    const version = ++request.current;
    setLoading(true);
    try {
      const current = await authService.me();
      if (version === request.current) { setClient(current); setUnavailable(false); }
    } catch {
      if (version === request.current) { setClient(null); setUnavailable(true); }
    } finally {
      if (version === request.current) setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    return () => { request.current += 1; };
  }, []);

  async function login(input: LoginInput) {
    const current = await authService.login(input);
    request.current += 1;
    setClient(current);
    setLoading(false);
    setUnavailable(false);
  }

  async function logout() {
    await authService.logout();
    request.current += 1;
    setClient(null);
    setLoading(false);
    setUnavailable(false);
  }

  return (
    <AuthContext.Provider value={{ client, loading, unavailable, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Coloca AuthProvider alrededor de App.');
  return context;
}
