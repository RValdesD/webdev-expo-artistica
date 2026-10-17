import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction, CookieOptions } from 'express';
import type { Types } from 'mongoose';
import { Client } from '../models/Client.js';
import { ClientSession } from '../models/ClientSession.js';

export interface ClientIdentity { id: string; name: string; email: string; role: 'client' }
export interface AuthLocals { client: ClientIdentity | null }
export type AuthResponse = Response<unknown, AuthLocals>;

const cookieName = 'expo_session';
const duration = 7 * 24 * 60 * 60 * 1000;
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function readToken(req: Request): string | null {
  const entry = req.headers.cookie?.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${cookieName}=`));
  const token = entry?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function endSession(req: Request, res: Response): Promise<void> {
  const token = readToken(req);
  if (token) await ClientSession.deleteOne({ tokenHash: tokenHash(token) });
  res.clearCookie(cookieName, cookieOptions);
}

export async function startSession(clientId: Types.ObjectId, req: Request, res: Response): Promise<void> {
  // A successful login always gets a fresh token; an old browser session is revoked.
  await endSession(req, res);
  const token = randomBytes(32).toString('hex');
  await ClientSession.create({ tokenHash: tokenHash(token), clientId, expiresAt: new Date(Date.now() + duration) });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: duration });
}

export async function optionalClient(req: Request, res: AuthResponse, next: NextFunction): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.locals.client = null;
  try {
    const token = readToken(req);
    if (token) {
      // TTL cleanup is asynchronous: explicitly reject expired sessions here.
      const session = await ClientSession.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } });
      if (session) {
        const client = await Client.findById(session.clientId);
        if (client && client.role === 'client') {
          res.locals.client = { id: client.id, name: client.name, email: client.email, role: 'client' };
        }
      }
      if (!res.locals.client) res.clearCookie(cookieName, cookieOptions);
    }
    next();
  } catch (error: unknown) {
    next(error);
  }
}

export function requireClient(_req: Request, res: AuthResponse, next: NextFunction): void {
  if (!res.locals.client) {
    res.status(401).json({ error: 'Inicia sesión para inscribirte.' });
    return;
  }
  next();
}
