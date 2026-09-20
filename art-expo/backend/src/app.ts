import express from 'express';
import expoRoute from './routes/expoRoute.js';
import { errorHandler } from './middleware/errorHandler.js';
import artistsRoute from './routes/artistsRoute.js';
import artworksRoute from './routes/artworksRoute.js';
import workshopsRoute from './routes/workshopsRoute.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use('/api', expoRoute);
app.use('/api', artistsRoute);
app.use('/api', artworksRoute);
app.use('/api', workshopsRoute);

app.use((_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
app.use(errorHandler);
export default app;
