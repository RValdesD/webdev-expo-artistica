import axios from 'axios';
import axiosSecure, { CSRF_STORAGE_KEY } from '../utils/axiosSecure';
import type { LoginInput, User } from '../types/auth';

export async function login(input: LoginInput): Promise<User> {
  const response = await axiosSecure.post<{ user: User }>('/api/login', input);
  const csrf = response.headers['x-csrf-token'];
  if (typeof csrf !== 'string') throw new Error('El servidor no entregó el token CSRF.');
  localStorage.setItem(CSRF_STORAGE_KEY, csrf);
  return response.data.user;
}

export async function restoreLogin(): Promise<User | null> {
  try {
    const response = await axiosSecure.get<{ user: User }>('/api/login/me');
    // El servidor renueva el CSRF al restaurar la sesión.
    const csrf = response.headers['x-csrf-token'];
    if (typeof csrf === 'string') localStorage.setItem(CSRF_STORAGE_KEY, csrf);
    return response.data.user;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(CSRF_STORAGE_KEY);
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try { await axiosSecure.post('/api/login/logout'); }
  catch (error: unknown) {
    // A rejected/expired session is already logged out locally. On network or
    // server failure retain both credentials and UI state so logout can retry.
    if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  }
  localStorage.removeItem(CSRF_STORAGE_KEY);
}

export default { login, restoreLogin, logout };
