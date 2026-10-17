import axios from 'axios';
import type { RegisterInput, User } from '../types/auth';

const register = (input: RegisterInput): Promise<User> =>
  axios.post<{ user: User }>('/api/users', input).then(response => response.data.user);

export default { register };
