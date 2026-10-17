import mongoose from 'mongoose';
import app from './app.js';
import { mongoUri, databaseName, port, host } from './config.js';

try {
  // Only accept requests after MongoDB is ready.
  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  app.listen(port, host, () => console.log(`Servidor: http://${host}:${port}`));
} catch (error: unknown) {
  console.error('No se pudo iniciar el servidor. Comprueba MongoDB y backend/.env.', error);
  process.exitCode = 1;
}
