export interface User {
  id: string;
  name: string;
  username: string;
}

export interface LoginInput { username: string; password: string }
export interface RegisterInput extends LoginInput { name: string }
