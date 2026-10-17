import 'dotenv/config';

export const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
export const MONGODB_DBNAME = process.env.MONGODB_DBNAME ?? 'art_expo';
export const PORT = Number(process.env.PORT ?? 3001);
export const HOST = process.env.HOST ?? '127.0.0.1';
export const JWT_SECRET = process.env.JWT_SECRET ?? '';
export const NODE_ENV = process.env.NODE_ENV ?? 'development';

export function assertRequiredConfig(): void {
  if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en backend/.env.');
}
