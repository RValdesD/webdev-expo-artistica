import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

const usersRouter = Router();

usersRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[a-z0-9._-]{3,40}$/.test(username) || !name || password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Revisa el usuario, nombre y contraseña. La contraseña debe tener entre 8 y 128 caracteres.' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    // Public registration never accepts a role supplied by the browser.
    const user = await User.create({ username, name, passwordHash, role: 'visitante' });
    res.status(201).json({ user });
  } catch (error: unknown) { next(error); }
});

export default usersRouter;
