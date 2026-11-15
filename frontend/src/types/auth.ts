export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: 'visitante' | 'organizador' | 'artista';
}

export interface LoginInput { username: string; password: string }
export interface RegisterInput extends LoginInput { name: string; email: string }
