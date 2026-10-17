export interface Client {
  id: string;
  name: string;
  email: string;
  role: 'client';
}

export interface LoginInput { email: string; password: string }
export interface SignupInput extends LoginInput { name: string }
