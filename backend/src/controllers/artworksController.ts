import { Router } from 'express';
import { Artwork } from '../models/Artwork.js';
import { Artist } from '../models/Artist.js';
import { withUser } from '../utils/middleware.js';

const artworksRouter = Router();
const allowed = ['id', 'title', 'artistId', 'medium', 'imageUrl', 'year', 'description'] as const;

function artworkBody(body: unknown): Record<string, unknown> {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(allowed.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}

async function present(query: ReturnType<typeof Artwork.find>) {
  const artworks = await query.select('id title artistId medium imageUrl year description isSample -_id').lean();
  const artists = await Artist.find({ id: { $in: artworks.map(item => item.artistId) } }).select('id name -_id').lean();
  const names = new Map(artists.map(artist => [artist.id, artist.name]));
  return artworks.map(item => ({ ...item, artist: names.has(item.artistId) ? { id: item.artistId, name: names.get(item.artistId) } : null }));
}

artworksRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await present(Artwork.find().sort({ title: 1 })));
  } catch (error: unknown) { next(error); }
});

artworksRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await present(Artwork.find({ id: req.params.id }));
    if (!result[0]) { res.status(404).json({ error: 'Obra no encontrada.' }); return; }
    res.json(result[0]);
  } catch (error: unknown) { next(error); }
});

artworksRouter.post('/', withUser, async (req, res, next) => {
  try {
    const input = artworkBody(req.body);
    if (typeof input.artistId !== 'string' || !await Artist.exists({ id: input.artistId })) {
      res.status(400).json({ error: 'El artista indicado no existe.' }); return;
    }
    res.status(201).json(await Artwork.create(input));
  } catch (error: unknown) { next(error); }
});

artworksRouter.put('/:id', withUser, async (req, res, next) => {
  try {
    const input = artworkBody(req.body);
    delete input.id;
    if (input.artistId !== undefined && (typeof input.artistId !== 'string' || !await Artist.exists({ id: input.artistId }))) {
      res.status(400).json({ error: 'El artista indicado no existe.' }); return;
    }
    const artwork = await Artwork.findOneAndUpdate({ id: req.params.id }, input, { new: true, runValidators: true });
    if (!artwork) { res.status(404).json({ error: 'Obra no encontrada.' }); return; }
    res.json(artwork);
  } catch (error: unknown) { next(error); }
});

artworksRouter.delete('/:id', withUser, async (req, res, next) => {
  try {
    if (!await Artwork.findOneAndDelete({ id: req.params.id })) { res.status(404).json({ error: 'Obra no encontrada.' }); return; }
    res.status(204).end();
  } catch (error: unknown) { next(error); }
});

export default artworksRouter;
