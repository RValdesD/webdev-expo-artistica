import type { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.js';
import { dummyPasswordHash, hashPassword, verifyPassword, PasswordBusyError } from '../auth/passwords.js';
import { parseCredentials, parseSignup } from '../auth/validation.js';
import { startSession, endSession, type AuthResponse } from '../auth/sessions.js';

type BodyRequest = Request<Record<string, string>, unknown, unknown>;

export async function signup(req: BodyRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = parseSignup(req.body);
    if (!input) {
      res.status(400).json({ error: 'Indica nombre, correo y una contraseña de 15 a 128 caracteres.' });
      return;
    }
    await Client.init(); // Ensure the unique email index before accepting accounts.
    const passwordHash = await hashPassword(input.password);
    await Client.create({ name: input.name, email: input.email, passwordHash, role: 'client' });
    // Signup and login are separate flows; account creation does not issue a session.
    res.status(201).json({ message: 'Cuenta creada. Ya puedes iniciar sesión.' });
  } catch (error: unknown) {
    if (error instanceof PasswordBusyError) {
      res.status(503).json({ error: 'Inténtalo nuevamente en unos segundos.' });
      return;
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      res.status(409).json({ error: 'No se pudo crear la cuenta con ese correo. Prueba iniciar sesión.' });
      return;
    }
    next(error);
  }
}

export async function login(req: BodyRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = parseCredentials(req.body);
    if (!input) {
      res.status(400).json({ error: 'Indica correo y contraseña válidos.' });
      return;
    }
    const client = await Client.findOne({ email: input.email }).select('+passwordHash');
    const matches = await verifyPassword(input.password, client?.passwordHash ?? dummyPasswordHash);
    if (!client || !matches || client.role !== 'client') {
      res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      return;
    }
    await startSession(client._id, req, res);
    res.json({ client: { id: client.id, name: client.name, email: client.email, role: 'client' } });
  } catch (error: unknown) {
    if (error instanceof PasswordBusyError) {
      res.status(503).json({ error: 'Inténtalo nuevamente en unos segundos.' });
      return;
    }
    next(error);
  }
}

export function me(_req: Request, res: AuthResponse): void {
  res.json({ client: res.locals.client });
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await endSession(req, res);
    res.status(204).end();
  } catch (error: unknown) {
    next(error);
  }
}
