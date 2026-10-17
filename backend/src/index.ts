import mongoose from 'mongoose';
import app from './app.js';
import { assertRequiredConfig, HOST, MONGODB_DBNAME, MONGODB_URI, PORT } from './utils/config.js';
import * as logger from './utils/logger.js';

try {
  assertRequiredConfig();
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
  app.listen(PORT, HOST, () => logger.info(`Servidor: http://${HOST}:${PORT}`));
} catch (error: unknown) {
  logger.error('No se pudo iniciar el servidor. Comprueba MongoDB y backend/.env.', error);
  process.exitCode = 1;
}
