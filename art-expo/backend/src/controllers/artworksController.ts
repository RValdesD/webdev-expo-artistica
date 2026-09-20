import type { Request, Response, NextFunction } from 'express';
import { Artwork } from '../models/Artwork.js';
import { Artist } from '../models/Artist.js';

export async function getArtworks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const artworks = await Artwork.find()
      .select('id title artistId medium imageUrl year description isSample -_id')
      .sort({ title: 1 })
      .lean();

    const artistIds = [...new Set(artworks.map(artwork => artwork.artistId))];
    const artists = await Artist.find({ id: { $in: artistIds } })
      .select('id name -_id')
      .lean();
    const names = new Map(artists.map(artist => [artist.id, artist.name]));

    res.json(artworks.map(artwork => {
      const name = names.get(artwork.artistId);
      return {
        ...artwork,
        artist: name === undefined ? null : { id: artwork.artistId, name },
      };
    }));
  } catch (error: unknown) {
    next(error);
  }
}
