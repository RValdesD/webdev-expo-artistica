import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET, NODE_ENV } from '../utils/config.js';
import { withUser } from '../utils/middleware.js';

const loginRouter = Router();
const cookieSecurity = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: NODE_ENV === 'production',
  path: '/',
};

loginRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    // El mismo campo acepta el nombre de usuario o el correo.
    const identifier = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const query = identifier.includes('@') ? { email: identifier } : { username: identifier };
    const user = await User.findOne(query).select('+passwordHash');
    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid || !user) {
      res.status(401).json({ error: 'Usuario, correo o contraseña incorrectos.' });
      return;
    }

    const csrf = randomUUID();
    const token = jwt.sign({ id: user.id, username: user.username, csrf }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { ...cookieSecurity, maxAge: 60 * 60 * 1000 });
    res.setHeader('X-CSRF-Token', csrf);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ user });
  } catch (error: unknown) { next(error); }
});

loginRouter.get('/me', withUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: 'La sesión ya no es válida.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ user });
  } catch (error: unknown) { next(error); }
});

loginRouter.post('/logout', withUser, (_req, res) => {
  res.clearCookie('token', cookieSecurity);
  res.setHeader('Cache-Control', 'no-store');
  res.status(204).end();
});

export default loginRouter;
