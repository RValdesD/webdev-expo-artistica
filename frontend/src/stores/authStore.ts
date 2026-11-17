import { create } from 'zustand';
import loginService from '../services/login';
import type { LoginInput, User } from '../types/auth';

// Store global de la sesión (reemplaza al antiguo AuthContext).
interface AuthState {
  user: User | null;
  loading: boolean;
  // true cuando el servidor no respondió al comprobar la sesión.
  unavailable: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

// Cada petición recibe un número; si llega una respuesta vieja después de un login o logout, se ignora.
let request = 0;

export const useAuthStore = create<AuthState>()(set => ({
  user: null,
  loading: true,
  unavailable: false,

  async refresh() {
    const version = ++request;
    set({ loading: true });
    try {
      const user = await loginService.restoreLogin();
      if (version === request) set({ user, loading: false, unavailable: false });
    } catch {
      if (version === request) set({ user: null, loading: false, unavailable: true });
    }
  },

  async login(input) {
    const user = await loginService.login(input);
    request += 1;
    set({ user, loading: false, unavailable: false });
  },

  async logout() {
    await loginService.logout();
    request += 1;
    set({ user: null, loading: false, unavailable: false });
  },
}));
