import { Router } from 'express';
import { Artist } from '../models/Artist.js';
import { Artwork } from '../models/Artwork.js';
import { Workshop } from '../models/Workshop.js';
import { withUser, requireOrganizer } from '../utils/middleware.js';
import { pickFields } from '../utils/body.js';

const artistsRouter = Router();
const publicFields = 'id name bio discipline imageUrl socials isSample -_id';
const allowed = ['id', 'name', 'bio', 'discipline', 'imageUrl', 'socials'] as const;


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
  try {
    const fields = pickFields(req.body, allowed);
    if (!fields) { res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON.' }); return; }
    res.status(201).json(await Artist.create(fields));
  } catch (error: unknown) { next(error); }
});

artistsRouter.put('/:id', withUser, requireOrganizer, async (req, res, next) => {
  try {
    const changes = pickFields(req.body, allowed);
    if (!changes) { res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON.' }); return; }
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
