import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: error.message }); return;
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
}
