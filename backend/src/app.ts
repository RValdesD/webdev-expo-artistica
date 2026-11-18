import express from 'express';
import artistAccountRouter from './controllers/artistAccount.js';
import submissionsRouter from './controllers/submissions.js';
import { uploadDirectory } from './utils/uploads.js';
import exhibitionsRouter from './controllers/exhibitions.js';
import guidedToursRouter from './controllers/guidedTours.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import usersRouter from './controllers/users.js';
import loginRouter from './controllers/login.js';
import artistsRouter from './controllers/artistsController.js';
import artworksRouter from './controllers/artworksController.js';
import workshopsRouter from './controllers/workshopsController.js';
import expoRouter from './controllers/expoController.js';
import registrationsRouter from './controllers/registrations.js';
import { errorHandler, requestLogger, unknownEndpoint } from './utils/middleware.js';
import testingRouter from './controllers/testing.js';
import { NODE_ENV } from './utils/config.js';

const app = express();
app.disable('x-powered-by');
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: '20kb' }));
app.use('/images/uploads', express.static(uploadDirectory, { dotfiles: 'deny', setHeaders: res => { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));
app.use('/api/artist-account', artistAccountRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/artworks', artworksRouter);
app.use('/api/workshops', workshopsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/expo', expoRouter);
app.use('/api/exhibitions', exhibitionsRouter);
app.use('/api/guided-tours', guidedToursRouter);
// Ruta para reiniciar la base de datos en las pruebas E2E; no existe en desarrollo ni en producción.
if (NODE_ENV === 'test') app.use('/api/testing', testingRouter);
// Production serves the built React application and API on the same origin.
// Keep unknown API URLs as JSON errors rather than returning the SPA.
app.use('/api', unknownEndpoint);
const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
// Vite pone un hash en el nombre de cada archivo de /assets, así que nunca cambian.
app.use('/assets', express.static(path.join(frontendDist, 'assets'), { immutable: true, maxAge: '1y' }));
// index: false para que "/" también pase por el fallback y reciba Cache-Control: no-cache.
app.use(express.static(frontendDist, { index: false }));
// SPA fallback: cualquier ruta de la app (/catalog/:id, /mi-visita, ...) recibe index.html y
// React Router decide qué mostrar. Una URL con extensión (.js, .png, ...) es un archivo que
// no existe: responde 404 en vez de HTML, para que un chunk viejo tras un redeploy falle claro.
// index.html no se cachea, así el navegador toma el build nuevo después de cada despliegue.
app.get('*', (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile('index.html', { root: frontendDist, headers: { 'Cache-Control': 'no-cache' } }, error => {
    if (error) next();
  });
});
app.use(unknownEndpoint);
app.use(errorHandler);
export default app;
