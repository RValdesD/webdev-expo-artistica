import express from 'express';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import usersRouter from './controllers/users.js';
import loginRouter from './controllers/login.js';
import artistsRouter from './controllers/artistsController.js';
import artworksRouter from './controllers/artworksController.js';
import workshopsRouter from './controllers/workshopsController.js';
import expoRouter from './controllers/expoController.js';
import registrationsRouter from './controllers/registrations.js';
import { errorHandler, requestLogger, unknownEndpoint } from './utils/middleware.js';

const app = express();
app.disable('x-powered-by');
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: '20kb' }));
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/artworks', artworksRouter);
app.use('/api/workshops', workshopsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/expo', expoRouter);
// Production serves the built React application and API on the same origin.
// Keep unknown API URLs as JSON errors rather than returning the SPA.
app.use('/api', unknownEndpoint);
const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(frontendDist));
app.get('*', (_req, res, next) => {
  res.sendFile('index.html', { root: frontendDist }, error => {
    if (error) next();
  });
});
app.use(unknownEndpoint);
app.use(errorHandler);
export default app;
