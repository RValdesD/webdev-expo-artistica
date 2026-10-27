import { randomUUID } from 'node:crypto';
import { Router, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET, NODE_ENV } from '../utils/config.js';
import { requireSameOrigin, withUser } from '../utils/middleware.js';

const loginRouter = Router();
const cookieSecurity = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: NODE_ENV === 'production',
  path: '/',
};
const SESSION_SECONDS = 60 * 60;

// Firma el JWT con un CSRF nuevo y lo entrega: el JWT en la cookie httpOnly y el
// CSRF en el header. `expiresAt` permite renovar el CSRF sin alargar la sesión.
function issueSession(res: Response, user: { id: string; username: string }, expiresAt: number): void {
  const csrf = randomUUID();
  const token = jwt.sign({ id: user.id, username: user.username, csrf, exp: expiresAt }, JWT_SECRET);
  res.cookie('token', token, { ...cookieSecurity, maxAge: Math.max(0, expiresAt * 1000 - Date.now()) });
  res.setHeader('X-CSRF-Token', csrf);
  res.setHeader('Cache-Control', 'no-store');
}

loginRouter.post('/', requireSameOrigin, async (req, res, next) => {
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

    issueSession(res, { id: String(user.id), username: user.username }, Math.floor(Date.now() / 1000) + SESSION_SECONDS);
    res.json({ user });
  } catch (error: unknown) { next(error); }
});

// Restaurar la sesión solo lee datos, así que basta la cookie (SameSite=Strict impide
// que otro sitio la envíe). Entrega un CSRF nuevo: la sesión sigue funcionando
// aunque se haya borrado localStorage, y el CSRF anterior deja de servir.
loginRouter.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token as unknown;
    if (typeof token !== 'string') {
      res.status(401).json({ error: 'Sesión requerida.' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = typeof decoded !== 'string' && typeof decoded.id === 'string'
      ? await User.findById(decoded.id)
      : null;
    if (!user || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
      res.status(401).json({ error: 'La sesión ya no es válida.' });
      return;
    }
    issueSession(res, { id: String(user.id), username: user.username }, decoded.exp);
    res.json({ user });
  } catch (error: unknown) { next(error); }
});

loginRouter.post('/logout', withUser, (_req, res) => {
  res.clearCookie('token', cookieSecurity);
  res.setHeader('Cache-Control', 'no-store');
  res.status(204).end();
});

export default loginRouter;
