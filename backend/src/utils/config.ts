import 'dotenv/config';

export const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
export const MONGODB_DBNAME = process.env.MONGODB_DBNAME ?? 'art_expo';
export const PORT = Number(process.env.PORT ?? 3001);
export const HOST = process.env.HOST ?? '127.0.0.1';
export const JWT_SECRET = process.env.JWT_SECRET ?? '';
export const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Correos de organizador: solo se crean con `npm run user:create-admin`.
export const ADMIN_EMAIL_DOMAIN = (process.env.ADMIN_EMAIL_DOMAIN ?? 'admin.expo.cl').trim().toLowerCase();

// Orígenes que pueden iniciar sesión y registrarse, además del mismo origen del backend.
// En desarrollo se incluye Vite, porque su proxy cambia el Host a 127.0.0.1:3001.
// En producción, agregar la URL del frontend desplegado en ALLOWED_ORIGINS (separadas por coma).
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
export const ALLOWED_ORIGINS = [
  ...(NODE_ENV === 'production' ? [] : DEV_ORIGINS),
  ...(process.env.ALLOWED_ORIGINS ?? '').split(',').map(origin => origin.trim().replace(/\/$/, '')).filter(Boolean),
];

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`);
}

export function assertRequiredConfig(): void {
  if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en backend/.env.');
}
