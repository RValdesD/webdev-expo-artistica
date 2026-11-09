import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { ADMIN_EMAIL_DOMAIN, isAdminEmail } from '../utils/config.js';
import { requireSameOrigin } from '../utils/middleware.js';

const usersRouter = Router();

usersRouter.post('/', requireSameOrigin, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    // Cada campo con su propio mensaje, para mostrarlo junto al campo en el formulario.
    const fields: Record<string, string> = {};
    if (!name) fields.name = 'Escribe tu nombre.';
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) fields.username = 'Entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Ingresa un correo válido.';
    if (password.length < 8 || password.length > 128) fields.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
    if (Object.keys(fields).length) {
      res.status(400).json({ error: fields.email && Object.keys(fields).length === 1 ? fields.email : 'Revisa los campos marcados.', fields });
      return;
    }
    // Los correos de organizador no se registran desde el sitio: los crea el equipo
    // con `npm run user:create-admin`. Así nadie se vuelve organizador solo por el correo.
    if (isAdminEmail(email)) {
      const message = `Los correos @${ADMIN_EMAIL_DOMAIN} son solo para organizadores. Pide tu cuenta al equipo de la expo.`;
      res.status(403).json({ error: message, fields: { email: message } });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    // Public registration never accepts a role supplied by the browser.
    const user = await User.create({ username, email, name, passwordHash, role: 'visitante' });
    res.status(201).json({ user });
  } catch (error: unknown) {
    // Usuario o correo repetido: se avisa cuál de los dos, en vez del 409 genérico.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      const field = 'keyPattern' in error && typeof error.keyPattern === 'object' && error.keyPattern !== null && 'email' in error.keyPattern ? 'email' : 'username';
      const message = field === 'email' ? 'Ese correo ya está registrado.' : 'Ese nombre de usuario ya existe.';
      res.status(409).json({ error: message, fields: { [field]: message } });
      return;
    }
    next(error);
  }
});

export default usersRouter;
