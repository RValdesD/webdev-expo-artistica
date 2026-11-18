import { Router } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Artist } from '../models/Artist.js';
import { User } from '../models/User.js';
import { Exhibition } from '../models/Exhibition.js';
import { GuidedTour } from '../models/GuidedTour.js';

// Solo para las pruebas E2E (Playwright). app.ts lo monta únicamente con NODE_ENV=test,
// y el servidor E2E usa una base de datos en memoria: nunca toca la base real.
const testingRouter = Router();

interface TestUser { username: string; email?: string; name: string; password: string; role?: string }

// POST /api/testing/reset { users, artists, exhibitions, guidedTours } (todos opcionales)
// Borra todas las colecciones y crea lo que pide la prueba.
testingRouter.post('/reset', async (req, res, next) => {
  try {
    const body = req.body as { users?: TestUser[]; artists?: unknown[]; exhibitions?: unknown[]; guidedTours?: unknown[] };
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map(collection => collection.deleteMany({})));
    for (const { password, ...user } of body.users ?? []) {
      await User.create({ ...user, passwordHash: await bcrypt.hash(password, 4), createdVia: 'console' });
    }
    if (body.artists?.length) await Artist.create(body.artists);
    if (body.exhibitions?.length) await Exhibition.create(body.exhibitions);
    if (body.guidedTours?.length) await GuidedTour.create(body.guidedTours);
    res.status(204).end();
  } catch (error) { next(error); }
});

export default testingRouter;
