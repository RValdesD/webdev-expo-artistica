import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { JWT_SECRET } from './config.js';
import * as logger from './logger.js';

interface TokenPayload extends jwt.JwtPayload {
  id: string;
  username: string;
  csrf: string;
}

function isTokenPayload(value: string | jwt.JwtPayload): value is TokenPayload {
  return typeof value !== 'string'
    && typeof value.id === 'string'
    && typeof value.username === 'string'
    && typeof value.csrf === 'string';
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(req.method, req.path);
  next();
}

export function withUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token as unknown;
    const csrf = req.get('x-csrf-token');
    if (typeof token !== 'string' || !csrf || !JWT_SECRET) {
      res.status(401).json({ error: 'Sesión requerida.' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded) || decoded.csrf !== csrf) {
      res.status(401).json({ error: 'Sesión inválida.' });
      return;
    }
    req.userId = decoded.id;
    next();
  } catch (error: unknown) {
    next(error);
  }
}

export function optionalUser(req: Request, res: Response, next: NextFunction): void {
  // Public reads remain available when an optional session has expired.
  const token = req.cookies?.token as unknown;
  if (typeof token === 'string' && JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (isTokenPayload(decoded) && decoded.csrf === req.get('x-csrf-token')) req.userId = decoded.id;
    } catch (error: unknown) {
      if (!(error instanceof jwt.JsonWebTokenError)) { next(error); return; }
    }
  }
  next();
}

// Run after withUser. Read the current database role on every management request,
// so demotion takes effect even when an old JWT is still valid.
export async function requireOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Sesión requerida.' });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: 'La sesión ya no es válida.' });
      return;
    }
    if (user.role !== 'organizador') {
      res.status(403).json({ error: 'Solo los organizadores pueden gestionar el contenido.' });
      return;
    }
    next();
  } catch (error: unknown) { next(error); }
}

export function unknownEndpoint(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}

function duplicateError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: 'Sesión inválida o vencida.' });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `El campo ${error.path} contiene un valor inválido.` });
    return;
  }
  if (duplicateError(error)) {
    res.status(409).json({ error: 'Ya existe un recurso con ese identificador.' });
    return;
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({ error: 'El cuerpo JSON está mal formado.' });
    return;
  }
  logger.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
};
