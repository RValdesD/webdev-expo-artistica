import type { Request, Response, NextFunction } from 'express';
import { Artist } from '../models/Artist.js';

const publicFields = 'id name bio discipline imageUrl isSample -_id';

export async function getArtists(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const artists = await Artist.find().select(publicFields).sort({ name: 1 }).lean();
    res.json(artists);
  } catch (error: unknown) {
    next(error);
  }
}

export async function getArtist(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const artist = await Artist.findOne({ id: req.params.id }).select(publicFields).lean();
    if (!artist) {
      res.status(404).json({ error: 'Artista no encontrado.' });
      return;
    }
    res.json(artist);
  } catch (error: unknown) {
    next(error);
  }
}
