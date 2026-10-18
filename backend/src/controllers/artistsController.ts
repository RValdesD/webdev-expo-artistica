import { Router } from 'express';
import { Artist } from '../models/Artist.js';
import { Artwork } from '../models/Artwork.js';
import { Workshop } from '../models/Workshop.js';
import { withUser, requireOrganizer } from '../utils/middleware.js';

const artistsRouter = Router();
const publicFields = 'id name bio discipline imageUrl isSample -_id';
const allowed = ['id', 'name', 'bio', 'discipline', 'imageUrl'] as const;

function artistBody(body: unknown): Record<string, unknown> {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return Object.fromEntries(allowed.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
}

artistsRouter.get('/', async (_req, res, next) => {
  try { res.json(await Artist.find().select(publicFields).sort({ name: 1 }).lean()); }
  catch (error: unknown) { next(error); }
});

artistsRouter.get('/:id', async (req, res, next) => {
  try {
    const artist = await Artist.findOne({ id: req.params.id }).select(publicFields).lean();
    if (!artist) { res.status(404).json({ error: 'Artista no encontrado.' }); return; }
    res.json(artist);
  } catch (error: unknown) { next(error); }
});

artistsRouter.post('/', withUser, requireOrganizer, async (req, res, next) => {
  try { res.status(201).json(await Artist.create(artistBody(req.body))); }
  catch (error: unknown) { next(error); }
});

artistsRouter.put('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const changes = artistBody(req.body);
    delete changes.id;
    const artist = await Artist.findOneAndUpdate({ id: req.params.id }, changes, { new: true, runValidators: true });
    if (!artist) { res.status(404).json({ error: 'Artista no encontrado.' }); return; }
    res.json(artist);
  } catch (error: unknown) { next(error); }
});

artistsRouter.delete('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const referenced = await Promise.all([Artwork.exists({ artistId: req.params.id }), Workshop.exists({ artistId: req.params.id })]);
    if (referenced.some(Boolean)) { res.status(409).json({ error: 'No puedes eliminar un artista que todavía tiene obras o talleres.' }); return; }
    const artist = await Artist.findOneAndDelete({ id: req.params.id });
    if (!artist) { res.status(404).json({ error: 'Artista no encontrado.' }); return; }
    res.status(204).end();
  } catch (error: unknown) { next(error); }
});

export default artistsRouter;
