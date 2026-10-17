export interface Credentials { email: string; password: string }
export interface SignupInput extends Credentials { name: string }

export function parseCredentials(body: unknown): Credentials | null {
  if (typeof body !== 'object' || body === null ||
      !('email' in body) || typeof body.email !== 'string' ||
      !('password' in body) || typeof body.password !== 'string') return null;
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      body.password.length < 1 || body.password.length > 128) return null;
  return { email, password: body.password };
}

export function parseSignup(body: unknown): SignupInput | null {
  const credentials = parseCredentials(body);
  if (!credentials || credentials.password.length < 15 ||
      typeof body !== 'object' || body === null ||
      !('name' in body) || typeof body.name !== 'string') return null;
  const name = body.name.trim();
  if (!name || name.length > 120) return null;
  // Additional fields, including role, are intentionally not accepted.
  return { ...credentials, name };
}
