import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Servidor para las pruebas E2E: usa una base de datos en memoria (no toca la real)
// y sirve el frontend compilado (frontend/dist) en el mismo puerto que la API.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'e2e-tests-secret';
const port = Number(process.env.E2E_PORT ?? 3002);

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri(), { dbName: 'art_expo_e2e' });
const { default: app } = await import('../src/app.js');

const server = app.listen(port, '127.0.0.1', () => console.log(`Servidor E2E: http://127.0.0.1:${port}`));

async function stop() {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
