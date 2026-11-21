import axios from 'axios';
import type { RegisterInput, User } from '../types/auth';
import axiosSecure from '../utils/axiosSecure';

// Cuenta tal como la ve un organizador en Gestión.
export interface Account {
  id: string; username: string; name: string; email?: string;
  role: 'organizador' | 'artista' | 'visitante';
  createdVia: 'console' | 'registration' | 'unknown';
  // Solo en cuentas de artista: null mientras no guarden su perfil en "Mi perfil".
  artistProfile?: { id: string; slug: string } | null;
}

const register = (input: RegisterInput): Promise<User> =>
  axios.post<{ user: User }>('/api/users', input).then(response => response.data.user);

const getAll = (signal?: AbortSignal): Promise<Account[]> =>
  axiosSecure.get<Account[]>('/api/users', { signal }).then(response => response.data);

export default { register, getAll };
