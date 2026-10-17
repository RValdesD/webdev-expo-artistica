import type { Request, Response, NextFunction } from 'express';
import { Expo } from '../models/Expo.js';

export async function getExpo(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expo = await Expo.findOne({ slug: 'main' }).select('-_id -__v -createdAt -updatedAt').lean();
    if (!expo) { res.status(404).json({ error: 'Información aún no publicada.' }); return; }
    res.json(expo);
  } catch (error: unknown) { next(error); }
}
