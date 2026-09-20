import 'dotenv/config';

export const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
export const databaseName = process.env.MONGODB_DBNAME ?? 'art_expo';
export const port = Number(process.env.PORT ?? 3001);
export const host = process.env.HOST ?? '127.0.0.1';
